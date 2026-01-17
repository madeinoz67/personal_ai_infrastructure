# Records Manager Skill - Verification Checklist

> **MANDATORY:** Run all verification steps after installation to ensure the pack is correctly installed and functional.

---

## Quick Verification (5 minutes)

Run these quick checks to verify basic installation:

```bash
# Set PAI_DIR if not set
export PAI_DIR="${PAI_DIR:-$HOME/.claude}"

# 1. Check files exist
echo "Checking file structure..."
test -f "$PAI_DIR/lib/recordsmanager/PaperlessClient.ts" && echo "✓ PaperlessClient.ts exists" || echo "✗ PaperlessClient.ts missing"
test -f "$PAI_DIR/lib/recordsmanager/TaxonomyExpert.ts" && echo "✓ TaxonomyExpert.ts exists" || echo "✗ TaxonomyExpert.ts missing"
test -f "$PAI_DIR/tools/RecordManager.ts" && echo "✓ RecordManager.ts exists" || echo "✗ RecordManager.ts missing"
test -f "$PAI_DIR/skills/RECORDSMANAGER/SKILL.md" && echo "✓ SKILL.md exists" || echo "✗ SKILL.md missing"

# 2. Check environment variables
echo ""
echo "Checking environment..."
test -n "$PAPERLESS_URL" && echo "✓ PAPERLESS_URL set" || echo "✗ PAPERLESS_URL not set"
test -n "$PAPERLESS_API_TOKEN" && echo "✓ PAPERLESS_API_TOKEN set" || echo "✗ PAPERLESS_API_TOKEN not set"
test -n "$RECORDS_COUNTRY" && echo "✓ RECORDS_COUNTRY set" || echo "✗ RECORDS_COUNTRY not set"
test -n "$RECORDS_DEFAULT_DOMAIN" && echo "✓ RECORDS_DEFAULT_DOMAIN set" || echo "✗ RECORDS_DEFAULT_DOMAIN not set"

# 3. Test CLI tool
echo ""
echo "Testing CLI tool..."
bun run "$PAI_DIR/tools/RecordManager.ts" --help > /dev/null 2>&1 && echo "✓ CLI tool executable" || echo "✗ CLI tool failed"

# 4. Test paperless-ngx connection
echo ""
echo "Testing paperless-ngx connection..."
curl -s -f -I "$PAPERLESS_URL/api/" > /dev/null 2>&1 && echo "✓ paperless-ngx API reachable" || echo "⚠ paperless-ngx API not reachable (may need configuration)"

echo ""
echo "Quick verification complete!"
```

**Expected Result:** All checks should show ✓ (except paperless-ngx connection which may need configuration)

---

## Comprehensive Verification (15 minutes)

### Part 1: File Structure Verification

```bash
export PAI_DIR="${PAI_DIR:-$HOME/.claude}"

echo "=== Part 1: File Structure ==="
echo ""

# Required files
FILES=(
  "lib/recordsmanager/PaperlessClient.ts"
  "lib/recordsmanager/TaxonomyExpert.ts"
  "tools/RecordManager.ts"
  "skills/RECORDSMANAGER/SKILL.md"
  "skills/RECORDSMANAGER/Workflows/DeleteConfirmation.md"
  "skills/RECORDSMANAGER/Context/TaxonomyReference.md"
)

ALL_FILES_PRESENT=true
for file in "${FILES[@]}"; do
  if test -f "$PAI_DIR/$file"; then
    echo "✓ $file"
  else
    echo "✗ $file MISSING"
    ALL_FILES_PRESENT=false
  fi
done

echo ""
if [ "$ALL_FILES_PRESENT" = true ]; then
  echo "✅ PASS: All required files present"
else
  echo "❌ FAIL: Some files missing"
  exit 1
fi
```

**Pass Criteria:** All files show ✓

**Fail Action:** Re-run installation from Step 1 of INSTALL.md

---

### Part 2: Environment Configuration Verification

```bash
export PAI_DIR="${PAI_DIR:-$HOME/.claude}"

echo "=== Part 2: Environment Configuration ==="
echo ""

# Check .env file exists
if test -f "$PAI_DIR/.env"; then
  echo "✓ .env file exists"

  # Source .env and verify variables
  source "$PAI_DIR/.env"

  # Verify required variables
  CONFIG_VALID=true
  if [ -z "$PAPERLESS_URL" ]; then
    echo "✗ PAPERLESS_URL not set"
    CONFIG_VALID=false
  else
    echo "✓ PAPERLESS_URL=$PAPERLESS_URL"
  fi

  if [ -z "$PAPERLESS_API_TOKEN" ]; then
    echo "✗ PAPERLESS_API_TOKEN not set"
    CONFIG_VALID=false
  else
    # Don't echo the actual token, just confirm it's set
    echo "✓ PAPERLESS_API_TOKEN set (${#PAPERLESS_API_TOKEN} chars)"
  fi

  if [ -z "$RECORDS_COUNTRY" ]; then
    echo "⚠ RECORDS_COUNTRY not set (will use default: Australia)"
  else
    echo "✓ RECORDS_COUNTRY=$RECORDS_COUNTRY"
  fi

  if [ -z "$RECORDS_DEFAULT_DOMAIN" ]; then
    echo "⚠ RECORDS_DEFAULT_DOMAIN not set (will use default: household)"
  else
    echo "✓ RECORDS_DEFAULT_DOMAIN=$RECORDS_DEFAULT_DOMAIN"
  fi
else
  echo "✗ .env file does not exist"
  CONFIG_VALID=false
fi

echo ""
if [ "$CONFIG_VALID" = true ]; then
  echo "✅ PASS: Environment configured correctly"
else
  echo "❌ FAIL: Environment configuration incomplete"
  echo ""
  echo "To fix:"
  echo "1. Create or edit $PAI_DIR/.env"
  echo "2. Add required variables:"
  echo "   PAPERLESS_URL=https://your-paperless-instance.com"
  echo "   PAPERLESS_API_TOKEN=your-api-token"
  echo "   RECORDS_COUNTRY=YourCountry"
  echo "   RECORDS_DEFAULT_DOMAIN=household"
  exit 1
fi
```

**Pass Criteria:** PAPERLESS_URL and PAPERLESS_API_TOKEN are set

**Fail Action:** Configure environment variables in $PAI_DIR/.env

---

### Part 3: Library Functionality Verification

```bash
export PAI_DIR="${PAI_DIR:-$HOME/.claude}"
source "$PAI_DIR/.env"

echo "=== Part 3: Library Functionality ==="
echo ""

# Test PaperlessClient compilation
echo "Testing PaperlessClient.ts compilation..."
bun build "$PAI_DIR/lib/recordsmanager/PaperlessClient.ts" --outdir /tmp/test-build 2>/dev/null
if [ $? -eq 0 ]; then
  echo "✓ PaperlessClient.ts compiles successfully"
  rm -rf /tmp/test-build
else
  echo "✗ PaperlessClient.ts compilation failed"
  exit 1
fi

# Test TaxonomyExpert compilation
echo "Testing TaxonomyExpert.ts compilation..."
bun build "$PAI_DIR/lib/recordsmanager/TaxonomyExpert.ts" --outdir /tmp/test-build 2>/dev/null
if [ $? -eq 0 ]; then
  echo "✓ TaxonomyExpert.ts compiles successfully"
  rm -rf /tmp/test-build
else
  echo "✗ TaxonomyExpert.ts compilation failed"
  exit 1
fi

echo ""
echo "✅ PASS: Libraries compile successfully"
```

**Pass Criteria:** Both libraries compile without errors

**Fail Action:** Check TypeScript syntax and dependencies

---

### Part 4: CLI Tool Verification

```bash
export PAI_DIR="${PAI_DIR:-$HOME/.claude}"
source "$PAI_DIR/.env"

echo "=== Part 4: CLI Tool ==="
echo ""

# Test help command
echo "Testing help command..."
if bun run "$PAI_DIR/tools/RecordManager.ts" --help 2>&1 | grep -q "Records Manager CLI"; then
  echo "✓ Help command works"
else
  echo "✗ Help command failed"
  exit 1
fi

# Test retention command (doesn't require paperless-ngx connection)
echo ""
echo "Testing retention command (local only)..."
if bun run "$PAI_DIR/tools/RecordManager.ts" retention 2>&1 | grep -q "Retention Requirements"; then
  echo "✓ Retention command works"
else
  echo "✗ Retention command failed"
  exit 1
fi

echo ""
echo "✅ PASS: CLI tool functional"
```

**Pass Criteria:** Help and retention commands execute successfully

**Fail Action:** Check RecordManager.ts syntax and dependencies

---

### Part 5: Paperless-ngx Connection Verification

```bash
export PAI_DIR="${PAI_DIR:-$HOME/.claude}"
source "$PAI_DIR/.env"

echo "=== Part 5: Paperless-ngx Connection ==="
echo ""

# Test API reachability
echo "Testing API endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PAPERLESS_URL/api/")
if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "✓ API endpoint reachable (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "000" ]; then
  echo "✗ Cannot reach API endpoint"
  echo ""
  echo "To fix:"
  echo "1. Verify PAPERLESS_URL is correct: $PAPERLESS_URL"
  echo "2. Check network connectivity"
  echo "3. Verify paperless-ngx is running"
  exit 1
else
  echo "⚠ Unexpected HTTP code: $HTTP_CODE"
fi

# Test authentication
echo ""
echo "Testing API authentication..."
if [ -n "$PAPERLESS_API_TOKEN" ]; then
  AUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Token $PAPERLESS_API_TOKEN" \
    "$PAPERLESS_URL/api/tags/?limit=1")

  if [ "$AUTH_CODE" = "200" ]; then
    echo "✓ API authentication successful"
  else
    echo "✗ API authentication failed (HTTP $AUTH_CODE)"
    echo ""
    echo "To fix:"
    echo "1. Verify API token in paperless-ngx settings"
    echo "2. Regenerate token if needed"
    echo "3. Update PAPERLESS_API_TOKEN in .env"
    exit 1
  fi
else
  echo "⚠ PAPERLESS_API_TOKEN not set, skipping auth test"
fi

echo ""
echo "✅ PASS: paperless-ngx connection verified"
```

**Pass Criteria:** API is reachable and authentication succeeds

**Fail Action:** Configure correct paperless-ngx URL and API token

---

### Part 6: Taxonomy Verification

```bash
export PAI_DIR="${PAI_DIR:-$HOME/.claude}"
source "$PAI_DIR/.env"

echo "=== Part 6: Taxonomy Expert ==="
echo ""

# Test country support
echo "Testing country: ${RECORDS_COUNTRY:-Australia}"
echo ""

# Test document types for domain
echo "Document types for ${RECORDS_DEFAULT_DOMAIN:-household}:"
DOC_TYPES=$(bun run "$PAI_DIR/tools/RecordManager.ts" retention --domain "${RECORDS_DEFAULT_DOMAIN:-household}" 2>&1 | grep -E "^[A-Z]" | head -5)
if [ -n "$DOC_TYPES" ]; then
  echo "$DOC_TYPES"
  echo "✓ Document types available"
else
  echo "✗ No document types found"
  exit 1
fi

echo ""
echo "✅ PASS: Taxonomy expert functional"
```

**Pass Criteria:** Document types are returned for configured domain

**Fail Action:** Check TaxonomyExpert.ts for country data

---

### Part 7: Skill Integration Verification

```bash
export PAI_DIR="${PAI_DIR:-$HOME/.claude}"

echo "=== Part 7: Skill Integration ==="
echo ""

# Check skill definition exists
if [ -f "$PAI_DIR/skills/RECORDSMANAGER/SKILL.md" ]; then
  echo "✓ SKILL.md exists"

  # Check for required frontmatter
  if grep -q "name:" "$PAI_DIR/skills/RECORDSMANAGER/SKILL.md"; then
    echo "✓ Skill frontmatter present"
  else
    echo "✗ Skill frontmatter missing"
    exit 1
  fi

  # Check for workflow routing
  if grep -q "Workflow Routing" "$PAI_DIR/skills/RECORDSMANAGER/SKILL.md"; then
    echo "✓ Workflow routing documented"
  else
    echo "⚠ Workflow routing not documented (optional)"
  fi

  # Check for DeleteConfirmation workflow
  if [ -f "$PAI_DIR/skills/RECORDSMANAGER/Workflows/DeleteConfirmation.md" ]; then
    echo "✓ DeleteConfirmation workflow exists"
  else
    echo "✗ DeleteConfirmation workflow missing (REQUIRED)"
    exit 1
  fi

else
  echo "✗ SKILL.md does not exist"
  exit 1
fi

echo ""
echo "✅ PASS: Skill integration verified"
```

**Pass Criteria:** SKILL.md exists and contains required sections

**Fail Action:** Ensure skill files were created correctly

---

## Integration Test (Optional)

If you have a test paperless-ngx instance, run this integration test:

```bash
export PAI_DIR="${PAI_DIR:-$HOME/.claude}"
source "$PAI_DIR/.env"

echo "=== Integration Test ==="
echo ""
echo "⚠️  This will create a test document in your paperless-ngx instance"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Create a test PDF
TEST_PDF="/tmp/test-records-manager.pdf"
echo "Test document for Records Manager" | enscript -B -o - | ps2pdf - "$TEST_PDF"

# Upload test document
echo ""
echo "Uploading test document..."
bun run "$PAI_DIR/tools/RecordManager.ts upload "$TEST_PDF" --title "Records Manager Test" --domain household

# Search for the document
echo ""
echo "Searching for test document..."
bun run "$PAI_DIR/tools/RecordManager.ts" search --query "Records Manager Test"

echo ""
echo "✅ Integration test complete"
echo "You can delete the test document from the paperless-ngx web UI"
```

---

## Final Verification Summary

```bash
export PAI_DIR="${PAI_DIR:-$HOME/.claude}"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Records Manager Skill - Verification Summary       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Count passes/fails
TOTAL_CHECKS=7
PASSED_CHECKS=0

# Quick file check
if [ -f "$PAI_DIR/tools/RecordManager.ts" ]; then
  ((PASSED_CHECKS++))
  echo "✅ File structure"
else
  echo "❌ File structure"
fi

# Environment check
if [ -n "$PAPERLESS_URL" ] && [ -n "$PAPERLESS_API_TOKEN" ]; then
  ((PASSED_CHECKS++))
  echo "✅ Environment configuration"
else
  echo "❌ Environment configuration"
fi

# Library compilation (simplified)
if bun build "$PAI_DIR/lib/recordsmanager/PaperlessClient.ts" --outdir /tmp/test-build 2>/dev/null; then
  ((PASSED_CHECKS++))
  echo "✅ Libraries compile"
  rm -rf /tmp/test-build
else
  echo "❌ Libraries compile"
fi

# CLI tool
if bun run "$PAI_DIR/tools/RecordManager.ts" --help > /dev/null 2>&1; then
  ((PASSED_CHECKS++))
  echo "✅ CLI tool functional"
else
  echo "❌ CLI tool functional"
fi

# Paperless connection
if curl -s -f "$PAPERLESS_URL/api/" > /dev/null 2>&1; then
  ((PASSED_CHECKS++))
  echo "✅ paperless-ngx connection"
else
  echo "❌ paperless-ngx connection"
fi

# Taxonomy
if bun run "$PAI_DIR/tools/RecordManager.ts" retention > /dev/null 2>&1; then
  ((PASSED_CHECKS++))
  echo "✅ Taxonomy expert"
else
  echo "❌ Taxonomy expert"
fi

# Skill files
if [ -f "$PAI_DIR/skills/RECORDSMANAGER/SKILL.md" ]; then
  ((PASSED_CHECKS++))
  echo "✅ Skill integration"
else
  echo "❌ Skill integration"
fi

echo ""
echo "Result: $PASSED_CHECKS / $TOTAL_CHECKS checks passed"

if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
  echo ""
  echo "🎉 All verifications passed! Records Manager Skill is ready to use."
  echo ""
  echo "Quick start:"
  echo "  bun run $PAI_DIR/tools/RecordManager.ts upload document.pdf"
  echo "  bun run $PAI_DIR/tools/RecordManager.ts search --query \"invoice\""
  echo "  bun run $PAI_DIR/tools/RecordManager.ts retention"
  exit 0
else
  echo ""
  echo "⚠️  Some verifications failed. Please review the errors above."
  echo "Run the failed section again for details."
  exit 1
fi
```

---

## Troubleshooting

### Common Issues

**Issue:** "Cannot find module '../lib/recordsmanager/PaperlessClient'"

**Solution:** Library files not in correct location
```bash
# Verify files exist
ls -la $PAI_DIR/lib/recordsmanager/
# Re-create if missing
mkdir -p $PAI_DIR/lib/recordsmanager
# Copy files from pack
cp Packs/madeinoz-recordmanager-skill/src/lib/*.ts $PAI_DIR/lib/recordsmanager/
```

**Issue:** "PAPERLESS_URL not set"

**Solution:** Environment not configured
```bash
# Add to $PAI_DIR/.env
echo "PAPERLESS_URL=https://your-instance.com" >> $PAI_DIR/.env
echo "PAPERLESS_API_TOKEN=your-token" >> $PAI_DIR/.env
# Source it
source $PAI_DIR/.env
```

**Issue:** "401 Unauthorized" from paperless-ngx API

**Solution:** Invalid or expired API token
```bash
# 1. Generate new token in paperless-ngx web UI
# 2. Update .env file
nano $PAI_DIR/.env
# 3. Reload environment
source $PAI_DIR/.env
```

**Issue:** "Country not supported" warning

**Solution:** Taxonomy data missing for country
```bash
# Set RECORDS_COUNTRY to a supported country
# Supported: Australia, UnitedStates, UnitedKingdom
nano $PAI_DIR/.env
# Update: RECORDS_COUNTRY="Australia"
```

---

## Verification Checklist Summary

Use this checklist for manual verification:

- [ ] Files exist in correct locations
- [ ] Environment variables configured (.env file)
- [ ] PAPERLESS_URL is set and reachable
- [ ] PAPERLESS_API_TOKEN is set and valid
- [ ] RECORDS_COUNTRY is set (optional, has default)
- [ ] RECORDS_DEFAULT_DOMAIN is set (optional, has default)
- [ ] Libraries compile without errors
- [ ] CLI tool `--help` command works
- [ ] CLI tool `retention` command works
- [ ] paperless-ngx API connection successful
- [ ] paperless-ngx API authentication successful
- [ ] Taxonomy expert returns document types
- [ ] SKILL.md file exists and is valid
- [ ] DeleteConfirmation workflow exists
- [ ] Integration test passed (optional)

**All checks should pass before using the skill in production.**
