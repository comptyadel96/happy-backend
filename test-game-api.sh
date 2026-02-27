#!/bin/bash

# Game API Testing Script - Item Collection System v2.0
# This script demonstrates how to test all item collection endpoints

# Configuration
API_URL="http://localhost:3000"
JWT_TOKEN="your_jwt_token_here"  # Replace with actual token
USER_ID="test-user-123"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper function to print headers
print_section() {
    echo -e "\n${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"
}

# Helper function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Helper function to print info
print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Helper function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Test 1: Collect Chocolate Item
test_collect_chocolate() {
    print_section "Test 1: Collect Chocolate Item (10 pts)"
    
    curl -X PATCH "${API_URL}/game/item-collect" \
        -H "Authorization: Bearer ${JWT_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "levelId": 1,
            "itemType": "chocolate",
            "itemIndex": 0
        }' | jq '.'
}

# Test 2: Collect Egg Item
test_collect_egg() {
    print_section "Test 2: Collect Egg Item (25 pts)"
    
    curl -X PATCH "${API_URL}/game/item-collect" \
        -H "Authorization: Bearer ${JWT_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "levelId": 1,
            "itemType": "egg",
            "itemIndex": 0
        }' | jq '.'
}

# Test 3: Collect Diamond Item (NEW)
test_collect_diamond() {
    print_section "Test 3: Collect Diamond Item (100 pts) - NEW!"
    
    curl -X PATCH "${API_URL}/game/item-collect" \
        -H "Authorization: Bearer ${JWT_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "levelId": 1,
            "itemType": "diamond",
            "itemIndex": 0
        }' | jq '.'
}

# Test 4: Collect Star Item (NEW)
test_collect_star() {
    print_section "Test 4: Collect Star Item (50 pts) - NEW!"
    
    curl -X PATCH "${API_URL}/game/item-collect" \
        -H "Authorization: Bearer ${JWT_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "levelId": 1,
            "itemType": "star",
            "itemIndex": 0
        }' | jq '.'
}

# Test 5: Collect Coin Item (NEW)
test_collect_coin() {
    print_section "Test 5: Collect Coin Item (1 pt) - NEW!"
    
    curl -X PATCH "${API_URL}/game/item-collect" \
        -H "Authorization: Bearer ${JWT_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "levelId": 1,
            "itemType": "coin",
            "itemIndex": 0
        }' | jq '.'
}

# Test 6: Prevent Duplicate Collection
test_duplicate_prevention() {
    print_section "Test 6: Prevent Duplicate Collection"
    
    print_info "Attempting to collect same chocolate twice..."
    
    # First collection (should succeed)
    curl -s -X PATCH "${API_URL}/game/item-collect" \
        -H "Authorization: Bearer ${JWT_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "levelId": 2,
            "itemType": "chocolate",
            "itemIndex": 5
        }' > /tmp/first.json
    
    echo "First collection:"
    cat /tmp/first.json | jq '.'
    
    # Second collection (should fail)
    echo ""
    echo "Second collection (duplicate):"
    curl -X PATCH "${API_URL}/game/item-collect" \
        -H "Authorization: Bearer ${JWT_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "levelId": 2,
            "itemType": "chocolate",
            "itemIndex": 5
        }' | jq '.'
}

# Test 7: Offline Mode Collection
test_offline_collection() {
    print_section "Test 7: Offline Mode Collection (skipValidation)"
    
    curl -X PATCH "${API_URL}/game/item-collect" \
        -H "Authorization: Bearer ${JWT_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "levelId": 1,
            "itemType": "diamond",
            "itemIndex": 2,
            "skipValidation": true
        }' | jq '.'
}

# Test 8: Complete Level
test_complete_level() {
    print_section "Test 8: Complete Level"
    
    curl -X PATCH "${API_URL}/game/level-complete" \
        -H "Authorization: Bearer ${JWT_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "levelId": 1,
            "score": 500,
            "timeSpent": 120
        }' | jq '.'
}

# Test 9: Get Player Stats
test_get_stats() {
    print_section "Test 9: Get Player Statistics"
    
    curl -X GET "${API_URL}/game/stats" \
        -H "Authorization: Bearer ${JWT_TOKEN}" \
        -H "Content-Type: application/json" | jq '.'
}

# Test 10: Sync Game State
test_sync_game_state() {
    print_section "Test 10: Sync Game State"
    
    curl -X PATCH "${API_URL}/game/sync" \
        -H "Authorization: Bearer ${JWT_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "levelsData": {
                "1": {
                    "chocolatesTaken": [0, 1, 2],
                    "eggsTaken": [0],
                    "diamondsTaken": [0],
                    "starsTaken": [],
                    "coinsTaken": [0, 1, 2]
                }
            },
            "totalScore": 1500,
            "totalPlayTime": 3600
        }' | jq '.'
}

# Test 11: Batch Collection Simulation
test_batch_collection() {
    print_section "Test 11: Batch Collection Simulation"
    
    print_info "Collecting 5 items in sequence..."
    
    items=(
        '{"levelId": 3, "itemType": "chocolate", "itemIndex": 0}'
        '{"levelId": 3, "itemType": "egg", "itemIndex": 0}'
        '{"levelId": 3, "itemType": "diamond", "itemIndex": 0}'
        '{"levelId": 3, "itemType": "star", "itemIndex": 0}'
        '{"levelId": 3, "itemType": "coin", "itemIndex": 0}'
    )
    
    total_points=0
    for item in "${items[@]}"; do
        echo ""
        print_info "Collecting: $item"
        
        response=$(curl -s -X PATCH "${API_URL}/game/item-collect" \
            -H "Authorization: Bearer ${JWT_TOKEN}" \
            -H "Content-Type: application/json" \
            -d "$item")
        
        echo "$response" | jq '.'
        
        # Extract earned points
        points=$(echo "$response" | jq '.earnedPoints // 0')
        total_points=$((total_points + points))
    done
    
    print_success "Batch collection complete!"
    print_success "Total points earned: ${total_points}"
}

# Test 12: Item Limit Enforcement
test_item_limits() {
    print_section "Test 12: Item Limit Enforcement"
    
    print_info "Testing limits for each item type..."
    
    # Note: These tests assume the default limits
    # chocolate: 30, egg: 20, diamond: 5, star: 10, coin: 100
    
    echo ""
    print_info "Diamond limit (max 5):"
    curl -X PATCH "${API_URL}/game/item-collect" \
        -H "Authorization: Bearer ${JWT_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "levelId": 4,
            "itemType": "diamond",
            "itemIndex": 100
        }' | jq '.error'
}

# Test 13: Error Handling - Invalid Item Type
test_error_invalid_type() {
    print_section "Test 13: Error Handling - Invalid Item Type"
    
    curl -X PATCH "${API_URL}/game/item-collect" \
        -H "Authorization: Bearer ${JWT_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "levelId": 1,
            "itemType": "invalid_item",
            "itemIndex": 0
        }' | jq '.'
}

# Test 14: Error Handling - Negative Index
test_error_negative_index() {
    print_section "Test 14: Error Handling - Negative Item Index"
    
    curl -X PATCH "${API_URL}/game/item-collect" \
        -H "Authorization: Bearer ${JWT_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "levelId": 1,
            "itemType": "chocolate",
            "itemIndex": -1
        }' | jq '.'
}

# Test 15: Authentication Error
test_auth_error() {
    print_section "Test 15: Authentication Error - Invalid Token"
    
    curl -X GET "${API_URL}/game/stats" \
        -H "Authorization: Bearer invalid_token" \
        -H "Content-Type: application/json" | jq '.'
}

# Main execution
main() {
    print_section "🎮 GAME API - ITEM COLLECTION SYSTEM v2.0 TESTS"
    
    print_info "API URL: ${API_URL}"
    print_info "Testing with JWT Token: ${JWT_TOKEN:0:20}..."
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed. Please install jq to format JSON output."
        echo "Install with: sudo apt-get install jq"
        exit 1
    fi
    
    # Run tests based on argument
    case "$1" in
        "chocolate")
            test_collect_chocolate
            ;;
        "egg")
            test_collect_egg
            ;;
        "diamond")
            test_collect_diamond
            ;;
        "star")
            test_collect_star
            ;;
        "coin")
            test_collect_coin
            ;;
        "duplicate")
            test_duplicate_prevention
            ;;
        "offline")
            test_offline_collection
            ;;
        "complete")
            test_complete_level
            ;;
        "stats")
            test_get_stats
            ;;
        "sync")
            test_sync_game_state
            ;;
        "batch")
            test_batch_collection
            ;;
        "limits")
            test_item_limits
            ;;
        "invalid-type")
            test_error_invalid_type
            ;;
        "negative-index")
            test_error_negative_index
            ;;
        "auth-error")
            test_auth_error
            ;;
        "all")
            test_collect_chocolate
            test_collect_egg
            test_collect_diamond
            test_collect_star
            test_collect_coin
            test_duplicate_prevention
            test_offline_collection
            test_complete_level
            test_get_stats
            test_sync_game_state
            test_batch_collection
            test_item_limits
            test_error_invalid_type
            test_error_negative_index
            test_auth_error
            ;;
        *)
            print_section "Available Tests"
            echo "Usage: $0 [test_name]"
            echo ""
            echo "Available tests:"
            echo "  chocolate        - Collect chocolate item (10 pts)"
            echo "  egg              - Collect egg item (25 pts)"
            echo "  diamond          - Collect diamond item (100 pts) - NEW"
            echo "  star             - Collect star item (50 pts) - NEW"
            echo "  coin             - Collect coin item (1 pt) - NEW"
            echo "  duplicate        - Test duplicate prevention"
            echo "  offline          - Test offline mode (skipValidation)"
            echo "  complete         - Complete level test"
            echo "  stats            - Get player statistics"
            echo "  sync             - Sync game state"
            echo "  batch            - Test batch collection"
            echo "  limits           - Test item limits"
            echo "  invalid-type     - Test invalid item type error"
            echo "  negative-index   - Test negative index error"
            echo "  auth-error       - Test authentication error"
            echo "  all              - Run all tests"
            echo ""
            echo "Examples:"
            echo "  $0 chocolate      # Test chocolate collection"
            echo "  $0 diamond        # Test diamond collection (NEW)"
            echo "  $0 batch          # Test batch collection"
            echo "  $0 all            # Run all tests"
            ;;
    esac
}

# Run main
main "$@"
