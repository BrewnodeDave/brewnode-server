#!/bin/bash

# BrewNode Server Release Helper
# This script helps with conventional commits and releases

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}=== BrewNode Server Release Helper ===${NC}"
    echo ""
}

print_usage() {
    echo -e "${YELLOW}Usage:${NC}"
    echo "  ./scripts/release.sh [OPTIONS]"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo "  -t, --type TYPE     Release type: patch|minor|major|prerelease"
    echo "  -d, --dry-run       Show what would be released without doing it"  
    echo "  -h, --help          Show this help message"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  ./scripts/release.sh --type minor"
    echo "  ./scripts/release.sh --dry-run"
    echo "  ./scripts/release.sh --type patch"
    echo ""
}

check_git_status() {
    echo -e "${BLUE}Checking git status...${NC}"
    
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${RED}Error: Working directory is not clean. Please commit or stash your changes.${NC}"
        exit 1
    fi
    
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
        echo -e "${YELLOW}Warning: You are not on main/master branch. Current branch: $CURRENT_BRANCH${NC}"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✓ Git status is clean${NC}"
}

run_tests() {
    echo -e "${BLUE}Running tests...${NC}"
    if npm test; then
        echo -e "${GREEN}✓ All tests passed${NC}"
    else
        echo -e "${RED}Error: Tests failed. Please fix failing tests before releasing.${NC}"
        exit 1
    fi
}

analyze_commits() {
    echo -e "${BLUE}Analyzing commits for automatic version detection...${NC}"
    
    # Get last tag
    LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
    
    if [ -z "$LAST_TAG" ]; then
        echo -e "${YELLOW}No previous tags found. This will be the initial release.${NC}"
        SUGGESTED_TYPE="minor"
    else
        echo "Last tag: $LAST_TAG"
        
        # Analyze commits since last tag
        FEAT_COUNT=$(git log $LAST_TAG..HEAD --oneline --grep="^feat" | wc -l)
        FIX_COUNT=$(git log $LAST_TAG..HEAD --oneline --grep="^fix" | wc -l) 
        BREAKING_COUNT=$(git log $LAST_TAG..HEAD --oneline --grep="BREAKING CHANGE" | wc -l)
        PERF_COUNT=$(git log $LAST_TAG..HEAD --oneline --grep="^perf" | wc -l)
        
        echo "Commits since $LAST_TAG:"
        echo "  - Features (feat): $FEAT_COUNT"
        echo "  - Bug fixes (fix): $FIX_COUNT"
        echo "  - Performance (perf): $PERF_COUNT"
        echo "  - Breaking changes: $BREAKING_COUNT"
        
        if [ $BREAKING_COUNT -gt 0 ]; then
            SUGGESTED_TYPE="major"
        elif [ $FEAT_COUNT -gt 0 ] || [ $PERF_COUNT -gt 0 ]; then
            SUGGESTED_TYPE="minor"
        elif [ $FIX_COUNT -gt 0 ]; then
            SUGGESTED_TYPE="patch"
        else
            SUGGESTED_TYPE="patch"
        fi
    fi
    
    echo -e "${GREEN}Suggested release type: $SUGGESTED_TYPE${NC}"
}

do_release() {
    local release_type=$1
    local dry_run=$2
    
    echo -e "${BLUE}Creating $release_type release...${NC}"
    
    if [ "$dry_run" = "true" ]; then
        echo -e "${YELLOW}DRY RUN MODE - No changes will be made${NC}"
        npm run release:dry -- --release-as $release_type
        return 0
    fi
    
    case $release_type in
        "major")
            npm run release:major
            ;;
        "minor") 
            npm run release:minor
            ;;
        "patch")
            npm run release:patch
            ;;
        "prerelease")
            npm run release:prerelease
            ;;
        *)
            echo -e "${RED}Error: Invalid release type '$release_type'${NC}"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}✓ Release created successfully${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Review the generated changelog and commit"
    echo "  2. Push the changes: git push --follow-tags origin main"  
    echo "  3. Publish to npm: npm publish"
    echo ""
    echo -e "${YELLOW}Or run: npm run postrelease (pushes and publishes automatically)${NC}"
}

# Main script
main() {
    local release_type=""
    local dry_run=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--type)
                release_type="$2"
                shift 2
                ;;
            -d|--dry-run)
                dry_run=true
                shift
                ;;
            -h|--help)
                print_header
                print_usage
                exit 0
                ;;
            *)
                echo -e "${RED}Error: Unknown option $1${NC}"
                print_usage
                exit 1
                ;;
        esac
    done
    
    print_header
    
    # Check git status
    if [ "$dry_run" != "true" ]; then
        check_git_status
    fi
    
    # Analyze commits for suggestions
    analyze_commits
    
    # If no release type specified, ask user
    if [ -z "$release_type" ]; then
        echo ""
        echo -e "${YELLOW}Select release type:${NC}"
        echo "  1) patch   - Bug fixes (${SUGGESTED_TYPE})"
        echo "  2) minor   - New features"
        echo "  3) major   - Breaking changes"
        echo "  4) prerelease - Pre-release version"
        echo ""
        read -p "Enter choice (1-4) or release type name [suggested: $SUGGESTED_TYPE]: " choice
        
        case $choice in
            1|"patch") release_type="patch" ;;
            2|"minor") release_type="minor" ;;
            3|"major") release_type="major" ;;
            4|"prerelease") release_type="prerelease" ;;
            "") release_type="$SUGGESTED_TYPE" ;;
            *) release_type="$choice" ;;
        esac
    fi
    
    # Run tests unless dry run
    if [ "$dry_run" != "true" ]; then
        run_tests
    fi
    
    # Create release
    do_release "$release_type" "$dry_run"
}

# Run main function with all arguments
main "$@"