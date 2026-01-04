#!/usr/bin/env python3
"""
MCP Server Wrapper for PAI Knowledge System

This script provides a simple command-line interface to the Graphiti MCP server.
It handles SSE (Server-Sent Events) communication and provides simple wrappers
around the MCP tools.

Usage:
    python mcp-wrapper.py add_episode "Episode title" "Episode body"
    python mcp-wrapper.py search_nodes "search query"
    python mcp-wrapper.py get_status
"""

import sys
import json
import urllib.request
import urllib.parse
from typing import Dict, Any, Optional

# MCP Server Configuration
MCP_SERVER_URL = "http://localhost:8000/sse"
TIMEOUT = 30  # seconds


def call_mcp_tool(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """
    Call an MCP tool on the Graphiti server.

    Args:
        tool_name: Name of the MCP tool to call
        arguments: Dictionary of arguments for the tool

    Returns:
        Response from the MCP server
    """
    # Create JSON-RPC request
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }

    try:
        # For SSE transport, we need to use POST to the endpoint
        # The Graphiti server handles both JSON-RPC and SSE
        req = urllib.request.Request(
            MCP_SERVER_URL,
            data=json.dumps(payload).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
            }
        )

        with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
            response_data = json.loads(response.read().decode('utf-8'))

            if 'error' in response_data:
                return {
                    'success': False,
                    'error': response_data['error']
                }

            return {
                'success': True,
                'data': response_data.get('result', {})
            }

    except urllib.error.HTTPError as e:
        return {
            'success': False,
            'error': f'HTTP {e.code}: {e.reason}'
        }
    except urllib.error.URLError as e:
        return {
            'success': False,
            'error': f'Connection error: {e.reason}'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def cmd_add_episode(args):
    """Add an episode to the knowledge graph."""
    if len(args) < 2:
        return {
            'success': False,
            'error': 'Usage: add_episode <title> <body> [source_description]'
        }

    title = args[0]
    body = args[1]
    source_description = args[2] if len(args) > 2 else None

    arguments = {
        'name': title,
        'episode_body': body,
    }

    if source_description:
        arguments['source_description'] = source_description

    return call_mcp_tool('add_episode', arguments)


def cmd_search_nodes(args):
    """Search for nodes in the knowledge graph."""
    if len(args) < 1:
        return {
            'success': False,
            'error': 'Usage: search_nodes <query> [limit]'
        }

    query = args[0]
    limit = int(args[1]) if len(args) > 1 else 5

    arguments = {
        'query': query,
        'limit': limit
    }

    return call_mcp_tool('search_nodes', arguments)


def cmd_search_facts(args):
    """Search for facts/relationships in the knowledge graph."""
    if len(args) < 1:
        return {
            'success': False,
            'error': 'Usage: search_facts <query> [limit]'
        }

    query = args[0]
    limit = int(args[1]) if len(args) > 1 else 5

    arguments = {
        'query': query,
        'limit': limit
    }

    return call_mcp_tool('search_facts', arguments)


def cmd_get_episodes(args):
    """Get recent episodes from the knowledge graph."""
    limit = int(args[0]) if len(args) > 0 else 5

    arguments = {
        'limit': limit
    }

    return call_mcp_tool('get_episodes', arguments)


def cmd_get_status(args):
    """Get the status of the knowledge graph."""
    return call_mcp_tool('get_status', {})


def cmd_clear_graph(args):
    """Clear all data from the knowledge graph."""
    # Safety check
    if '--force' not in args:
        return {
            'success': False,
            'error': 'This will delete ALL knowledge. Use --force to confirm.'
        }

    return call_mcp_tool('clear_graph', {})


def main():
    if len(sys.argv) < 2:
        print("Usage: python mcp-wrapper.py <command> [args...]")
        print("")
        print("Commands:")
        print("  add_episode <title> <body> [source]     Add knowledge to graph")
        print("  search_nodes <query> [limit]             Search entities")
        print("  search_facts <query> [limit]             Search relationships")
        print("  get_episodes [limit]                     Get recent episodes")
        print("  get_status                               Get graph status")
        print("  clear_graph --force                      Delete all knowledge")
        sys.exit(1)

    command = sys.argv[1]
    args = sys.argv[2:]

    # Map commands to functions
    commands = {
        'add_episode': cmd_add_episode,
        'search_nodes': cmd_search_nodes,
        'search_facts': cmd_search_facts,
        'get_episodes': cmd_get_episodes,
        'get_status': cmd_get_status,
        'clear_graph': cmd_clear_graph,
    }

    if command not in commands:
        print(f"Unknown command: {command}")
        print(f"Available commands: {', '.join(commands.keys())}")
        sys.exit(1)

    # Execute command
    result = commands[command](args)

    # Output result
    if result.get('success'):
        print(json.dumps(result['data'], indent=2))
        sys.exit(0)
    else:
        print(f"Error: {result.get('error')}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
