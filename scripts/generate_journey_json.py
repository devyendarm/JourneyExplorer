import json
import random
import time
from datetime import datetime, timedelta

# Phase 1: Journey Spec
JOURNEY_SPEC = {
    "journeyName": "Ecommerce Purchase Flow",
    "steps": [
        {"stepId": "1", "stepName": "Session Start", "order": 1},
        {"stepId": "2", "stepName": "Page View", "order": 2},
        {"stepId": "3", "stepName": "View Item", "order": 3},
        {"stepId": "4", "stepName": "Add to Cart", "order": 4},
        {"stepId": "5", "stepName": "Begin Checkout", "order": 5},
        {"stepId": "6", "stepName": "Add Shipping", "order": 6},
        {"stepId": "7", "stepName": "Purchase", "order": 7}
    ]
}

SEGMENTS = [{"segmentId": "all", "segmentName": "All Users"}]

# Helper to generate random distribution
def generate_distribution(items, count, min_rows=5, unknown_label="<Unknown>"):
    data = []
    remaining = count
    
    # Ensure min_rows
    if len(items) < min_rows:
        items.extend([f"Item {i}" for i in range(len(items), min_rows)])
    
    for item in items:
        if remaining <= 0: break
        val = random.randint(1, int(remaining * 0.5) + 1)
        data.append({"name": item, "count": val})
        remaining -= val
    
    # Imputation Rule 1 & 3: Bucket remainder or missing
    if remaining > 0:
        data.append({"name": unknown_label, "count": remaining})
        
    # Sort
    data.sort(key=lambda x: x["count"], reverse=True)
    return data

def generate_histogram(count, bins=20):
    # Phase 4: Histogram with smoothing
    hist = []
    for i in range(bins):
        val = random.randint(0, int(count * 0.2))
        # Rule 2: Smoothing (add-one if sparse - simplified here)
        if val == 0: val = 1 # Simple smoothing
        hist.append({"bin": i, "label": f"{i}-{i+1}m", "count": val})
    return hist

def generate_data():
    output = {
        "journey": {
            "id": "j1",
            "name": JOURNEY_SPEC["journeyName"],
            "dateRange": "2021-01-01 to 2021-01-31"
        },
        "steps": JOURNEY_SPEC["steps"],
        "segments": SEGMENTS,
        "stepMetricsBySegment": {},
        "transitionMetricsBySegment": {},
        "deepDiveBySegment": {}
    }

    # Generate metrics for 'all' segment
    segment_id = "all"
    output["stepMetricsBySegment"][segment_id] = {}
    output["deepDiveBySegment"][segment_id] = {}
    output["transitionMetricsBySegment"][segment_id] = {}

    users = 10000
    
    for i, step in enumerate(JOURNEY_SPEC["steps"]):
        step_id = step["stepId"]
        
        # Funnel drop-off
        if i > 0:
            users = int(users * random.uniform(0.6, 0.9))
        
        # Step Metrics
        output["stepMetricsBySegment"][segment_id][step_id] = {
            "users": users,
            "sessions": int(users * 1.2),
            "conversionFromPrev": 0.0 if i == 0 else (users / output["stepMetricsBySegment"][segment_id][JOURNEY_SPEC["steps"][i-1]["stepId"]]["users"])
        }

        # Realistic Ecommerce Micro-events
        ecom_events = [
            "view_item_list", "select_item", "view_item", "add_to_cart", 
            "remove_from_cart", "view_cart", "begin_checkout", "add_shipping_info",
            "add_payment_info", "purchase", "refund", "view_promotion", "select_promotion",
            "add_to_wishlist", "share", "search", "click_ad", "view_ad"
        ]
        
        # Assign relevant events per step context (simplified logic)
        step_context_events = {
            "1": ["view_promotion", "select_promotion", "search", "view_ad"], # Session Start
            "2": ["view_item_list", "select_item", "view_promotion", "search"], # Page View
            "3": ["add_to_wishlist", "share", "view_item_list", "select_item"], # View Item
            "4": ["view_cart", "remove_from_cart", "add_to_wishlist", "view_promotion"], # Add to Cart
            "5": ["add_shipping_info", "view_cart", "remove_from_cart"], # Begin Checkout
            "6": ["add_payment_info", "add_shipping_info"], # Add Shipping
            "7": ["refund", "share"] # Purchase
        }

        # Deep Dive Data
        output["deepDiveBySegment"][segment_id][step_id] = {
            "summary": output["stepMetricsBySegment"][segment_id][step_id],
            "channels": generate_distribution(["google/organic", "direct/none", "google/cpc", "newsletter/email", "facebook/social"], users, min_rows=5, unknown_label="<Unknown>"),
            "pages": generate_distribution(["/home", "/product/A", "/category/B", "/cart", "/checkout"], users, min_rows=10, unknown_label="<Unknown Page>"),
            "microEvents": generate_distribution(step_context_events.get(step_id, ecom_events), users, min_rows=3, unknown_label="<Other>")
        }

        # Transition Data (to next step)
        if i < len(JOURNEY_SPEC["steps"]) - 1:
            next_step_id = JOURNEY_SPEC["steps"][i+1]["stepId"]
            trans_key = f"{step_id}|{next_step_id}"
            
            output["transitionMetricsBySegment"][segment_id][trans_key] = {
                "betweenSteps": {
                    "histogram": generate_histogram(users),
                    "frictionSignals": generate_distribution(["error_click", "payment_failed"], int(users * 0.05), min_rows=0),
                    "detours": generate_distribution(["/shipping-policy", "/faq"], int(users * 0.1), min_rows=0)
                }
            }

    return output

if __name__ == "__main__":
    data = generate_data()
    with open("journey_data.json", "w") as f:
        json.dump(data, f, indent=2)
    print("Generated journey_data.json")
