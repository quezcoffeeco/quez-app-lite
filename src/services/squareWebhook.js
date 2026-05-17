// ============================================================
// QUEZ APP LITE — Square webhook integration (Q4 2026 placeholder)
//
// Cannot be wired live yet — needs:
//   1. A Square Developer account + OAuth credentials
//   2. A backend (Cloudflare Worker / Vercel Function / similar) to receive
//      Square's outbound webhooks (browsers can't accept them; GitHub Pages
//      can't either since it's a static host)
//   3. The bar trailer running with Square Terminal so orders actually flow
//
// This file documents the integration contract so the future drop-in is
// trivial: a small backend forwards Square `order.created` webhook payloads
// to the running Quez App via WebSocket or polled-localStorage write. From
// there, this module maps Square's order shape onto Quez's `addOrder()`
// shape — same call the practice seeder uses today.
//
// File intentionally has zero runtime effect right now. It exists so the
// Year 1 Q4 integration can land without re-discovering the contract.
// ============================================================

import { addOrder, getNextOrderNumber } from '../utils/storage';

// Quez expects orders shaped like:
//   {
//     id: 'ord_<source>_<ts>',     // unique; namespace by source
//     number: getNextOrderNumber(), // daily sequential
//     createdAt: ISO string,
//     takenBy: 'Square' | 'PRACTICE' | <employee name>,
//     window: 'drive-thru' | 'walk-up',
//     orderNote: string,           // customer name or tag
//     items: [{
//       itemId: 'itm_<ts>_<rand>',
//       drinkId: <Quez drinkRecipes id>,
//       drinkName: string,
//       size: '8oz' | '12oz' | '16oz',
//       prepType: 'hot' | 'iced' | 'blended',
//       modifiers: [<Quez modifier id>],
//       note: string,
//       done: false,
//       priority: false,
//     }],
//     tip: number,
//     practice: false,             // never true for live Square orders
//   }

// Square's webhook payload (simplified — see Square Orders API v2 docs):
//   {
//     type: 'order.created' | 'order.updated' | 'order.fulfillment.updated',
//     event_id, created_at, merchant_id, location_id,
//     data: {
//       object: {
//         order: {
//           id, version, location_id, source, state,
//           created_at, updated_at,
//           line_items: [{
//             uid, name, quantity, variation_name,
//             base_price_money, total_money,
//             modifiers: [{ uid, name, base_price_money }],
//             note,
//           }],
//           fulfillments: [{ type, state, pickup_details }],
//           customer_id?, ticket_name?,
//           total_money, tip_money,
//         }
//       }
//     }
//   }

// Map Square's catalog item names to Quez's drinkRecipes ids. Maintained
// alongside Square menu setup. For each Quez drink, set the matching
// Square `variation_name` (or `name`) string the merchant configured.
// Filled in during Q4 2026 once the Square menu is built.
const SQUARE_TO_QUEZ_DRINK_ID = {
  // 'Quez Honey Mocha': 'drk_01',
  // 'Hot Honey Spice Latte': 'drk_02',
  // ...
};

// Square modifier name → Quez modifier id. Same caveat — populated during
// Square menu config.
const SQUARE_TO_QUEZ_MODIFIER_ID = {
  // 'Oat Milk':       'milk_oat',
  // 'Almond Milk':    'milk_almond',
  // 'Extra Shot':     'shot_extra',
  // 'Extra Honey':    'extra_honey',
  // ...
};

// Map Square's variation_name (Small / Medium / Large) to Quez size keys.
const SQUARE_SIZE_TO_QUEZ_SIZE = {
  'Small':  '12oz',
  'Medium': '12oz',
  'Large':  '16oz',
  'Kids':   '8oz',
};

// Map Square's fulfillment.type → Quez window destination. Square uses
// 'PICKUP' generically; mobile coffee distinguishes drive-thru vs walk-up
// via a custom attribute on the order or via two separate Square pickup
// types (Square Restaurants supports configurable pickup labels).
function inferWindow(sqOrder) {
  const ful = (sqOrder.fulfillments || [])[0];
  if (!ful) return 'walk-up';
  const label = (ful.pickup_details?.note || ful.type || '').toLowerCase();
  if (label.includes('drive')) return 'drive-thru';
  return 'walk-up';
}

function inferPrepType(sqLineItem) {
  const name = `${sqLineItem.variation_name || ''} ${sqLineItem.name || ''}`.toLowerCase();
  if (name.includes('iced'))    return 'iced';
  if (name.includes('blended') || name.includes('frapp')) return 'blended';
  return 'hot';
}

// Public entry — backend webhook handler calls this with the Square order
// object. Returns the Quez order id or null if the order couldn't be mapped.
export function ingestSquareOrder(sqOrder) {
  if (!sqOrder || !sqOrder.line_items) return null;

  const items = sqOrder.line_items.map((li, i) => {
    const drinkId = SQUARE_TO_QUEZ_DRINK_ID[li.name] || SQUARE_TO_QUEZ_DRINK_ID[li.variation_name];
    if (!drinkId) {
      // Unmapped item — log to console for menu reconciliation
      console.warn('[Square ingest] Unmapped item:', li.name, li.variation_name);
    }
    const modifiers = (li.modifiers || [])
      .map((m) => SQUARE_TO_QUEZ_MODIFIER_ID[m.name])
      .filter(Boolean);
    return {
      itemId: `itm_sq_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 5)}`,
      drinkId: drinkId || 'drk_unknown',
      drinkName: li.name || li.variation_name || 'Unknown drink',
      size: SQUARE_SIZE_TO_QUEZ_SIZE[li.variation_name] || '12oz',
      prepType: inferPrepType(li),
      modifiers,
      note: li.note || '',
      done: false,
      priority: false,
    };
  });

  const quezOrder = {
    id: `ord_sq_${sqOrder.id || Date.now()}`,
    number: getNextOrderNumber(),
    createdAt: sqOrder.created_at || new Date().toISOString(),
    takenBy: 'Square',
    window: inferWindow(sqOrder),
    orderNote: sqOrder.ticket_name || '',
    items,
    tip: (sqOrder.tip_money?.amount || 0) / 100,
    practice: false,
  };

  addOrder(quezOrder);
  return quezOrder.id;
}

// Future: webhook signature verification, idempotency on Square's event_id
// (so retries don't duplicate the order), and a parallel ingestSquareFulfillment
// for when an item is marked complete at the bar (closes the loop back to
// Square so the customer's receipt reflects "ready").
