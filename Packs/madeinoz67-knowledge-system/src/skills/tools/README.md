# Knowledge Management Tools

This directory contains helper scripts and utilities for the Knowledge Management PAI skill.

## Available Tools

### Graph Status Check
```bash
# Quick health check for Graphiti server
./check-graph-health.sh
```

### Knowledge Export
```bash
# Export all episodes to markdown file
./export-knowledge.sh
```

### Knowledge Stats
```bash
# Show statistics about knowledge graph
./knowledge-stats.sh
```

## Tool Development

Tools should be:
- Written in bash or TypeScript
- Executable from command line
- Self-documenting with help flags
- Follow PAI tool conventions

See PAI SkillSystem.md for tool development guidelines.
