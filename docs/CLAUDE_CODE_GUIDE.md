# Claude Code Usage Guide

**Last Updated:** 2026-01-05

This guide explains how to effectively use Claude Code, Anthropic's official CLI for Claude, to work on the Metronome project. Claude Code differs significantly from other AI coding assistants like GitHub Copilot, Cline, and Roocode.

## What is Claude Code?

Claude Code is **not an autocomplete tool**. Instead, it's an **autonomous software engineering agent** that:

- **Reads and writes files** using specialized tools
- **Runs terminal commands** for building, testing, and deployment
- **Spawns specialized sub-agents** for complex multi-step tasks
- **Plans implementations** with user approval before making changes
- **Integrates with MCP servers** for extended capabilities

## Core Differences from Other Tools

### vs GitHub Copilot

| GitHub Copilot          | Claude Code                              |
| ----------------------- | ---------------------------------------- |
| Inline code completion  | Full-file editing and multi-file changes |
| Suggestions as you type | Autonomous task execution                |
| No file system access   | Direct file system interaction           |
| No terminal execution   | Runs commands via Bash tool              |

### vs Cline / Roocode

| Cline / Roocode                 | Claude Code                                 |
| ------------------------------- | ------------------------------------------- |
| MCP configured per-project      | MCP configured globally in settings         |
| Custom prompts in `.clinerules` | Skills system (user-defined slash commands) |
| Edit proposals in UI            | Direct file edits with streaming            |
| Agent spawning varies           | Standardized agent system with clear roles  |

## Claude Code's Agent System

Claude Code uses a **hierarchical agent architecture** with specialized sub-agents:

### Main Agent (You're talking to it now)

The main conversational agent that:

- Handles direct user requests
- Makes simple edits and runs commands
- Delegates complex tasks to specialized sub-agents
- Maintains conversation context across all operations

### Specialized Sub-Agents

Sub-agents are spawned for specific tasks and run **autonomously**:

#### **Explore Agent**

- **Purpose:** Fast codebase exploration and search
- **When to use:** Finding files, searching for patterns, understanding structure
- **Thoroughness levels:** `quick`, `medium`, `very thorough`

**Example:**

```text
User: "Where is error handling implemented?"
Claude: [Spawns Explore agent with medium thoroughness]
```

#### **Plan Agent**

- **Purpose:** Design implementation strategies before coding
- **When to use:** Complex features, architectural changes, multi-file refactors
- **Output:** Step-by-step implementation plan for user approval

**Example:**

```text
User: "Add user authentication"
Claude: [Spawns Plan agent to design auth strategy]
Plan Agent: [Explores codebase, proposes JWT vs session approach]
User: [Approves JWT approach]
Claude: [Implements based on approved plan]
```

#### **General-Purpose Agent**

- **Purpose:** Multi-step tasks requiring autonomy
- **When to use:** Research tasks, iterative searches, complex investigations
- **Access:** All tools available to main agent

**Example:**

```text
User: "Research best practices for Web Audio API metronomes"
Claude: [Spawns general-purpose agent]
Agent: [Searches docs, reads files, compiles report]
```

### When Agents Are Used

Claude Code **automatically decides** when to spawn agents based on task complexity:

- **Simple tasks:** Main agent handles directly
- **Exploration needed:** Spawns Explore agent
- **Implementation planning:** Spawns Plan agent
- **Complex research:** Spawns general-purpose agent

You can also **explicitly request agents** if you want:

```text
"Use the Explore agent to find all TypeScript interfaces"
"Create a Plan before implementing the audio engine"
```

## Skills: Custom Slash Commands

Skills are **user-defined workflows** accessible via slash commands. This project has several:

### Available Skills

- `/implement` - Execute development tasks with built-in review checkpoints
- `/plan` - Analyze codebase and create detailed development plan
- `/review` - Review code changes for quality and correctness
- `/clean` - Eliminate tech debt and simplify codebase
- `/readme` - Generate comprehensive README.md
- `/mcp-health` - Verify all MCP servers are operational

### Using Skills

Invoke skills by typing the command:

```text
/plan
/implement Add tap tempo button to UI
/review
```

Skills run as **specialized agents** with specific goals and tools.

## Model Context Protocol (MCP)

MCP extends Claude Code with external data sources and tools.

### How MCP Works in Claude Code

Unlike Cline/Roocode where MCP is configured per-project, Claude Code uses **global MCP configuration**:

**Configuration Location:**

```text
~/.config/claude-code/settings.json
```

**MCP Servers Available:**

- Check available servers: Type `/mcp-health` or inspect settings
- Servers provide tools, resources, and prompts
- Claude Code can use multiple MCP servers simultaneously

### Common MCP Servers

- **Filesystem:** Advanced file operations
- **GitHub:** Repository management, PR creation, issue tracking
- **Dev Tools:** Web fetch, documentation lookup, internet search
- **Database:** Query databases directly from Claude

### Using MCP Tools

MCP tools are **automatically available** once configured. Claude Code will:

1. Detect when an MCP tool is relevant
2. Use it transparently alongside built-in tools
3. Handle authentication and connection management

**Example:**

```text
User: "Fetch the latest Web Audio API docs"
Claude: [Uses dev-tools MCP server's fetch_url tool]
```

## Effective Patterns for This Project

### Phase-Based Development

The Metronome follows a **phased development plan** (see [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)). Work with Claude Code using this pattern:

1. **Review Phase Goals:**

   ```text
   "Let's work on Phase 4: Core Audio Engine. Show me what needs to be done."
   ```

2. **Plan Before Implementation:**

   ```text
   "Create a detailed plan for implementing the AudioEngine class"
   [Claude spawns Plan agent]
   [Review and approve plan]
   ```

3. **Implement Incrementally:**

   ```text
   "Implement the scheduler loop from the plan"
   [Claude implements]
   "Now add the click synthesis"
   [Claude adds feature]
   ```

4. **Review and Test:**

   ```text
   "/review the audio engine implementation"
   "Run the build and check for errors"
   ```

### Documentation-First Workflow

Since this project emphasizes "documentation ships with code":

```text
"Update AUDIO_ENGINE.md with the actual line references now that audioEngine.ts is implemented"
```

Claude Code can:

- Read implementation files
- Extract line numbers
- Update documentation with accurate links

### Parallel Exploration

For complex questions, explicitly request thoroughness:

```text
"Use the Explore agent with 'very thorough' mode to find all places where tempo is validated"
```

### Iterative Refinement

Claude Code maintains context across messages:

```text
User: "Add a tempo slider component"
Claude: [Implements basic slider]
User: "Add tap tempo to the same component"
Claude: [Edits existing component to add tap tempo]
User: "Make the slider more accessible"
Claude: [Adds ARIA labels and keyboard support]
```

## Common Workflows

### Starting a New Feature

```text
1. "I want to add [feature]. Create a plan first."
   [Claude spawns Plan agent]

2. [Review plan, ask questions, approve]

3. "Implement the plan"
   [Claude uses TodoWrite to track progress]
   [Claude implements step-by-step]

4. "/review"
   [Review skill checks implementation]

5. "Run tests and build"
   [Claude verifies everything works]
```

### Exploring Unfamiliar Code

```text
"Use the Explore agent to explain how the audio scheduling works"
[Agent reads files, traces logic, provides explanation]
```

### Fixing a Bug

```text
"There's a bug where tempo changes cause audio glitches"
[Claude explores relevant files]
[Claude identifies issue]
[Claude proposes fix]
[Claude implements and tests]
```

### Refactoring

```text
"Let's refactor the audio engine to use a class-based approach"
[Claude creates plan]
[User approves]
[Claude refactors with TodoWrite tracking]
```

## Tips for Best Results

### Be Specific About Scope

Good:

```text
"Add tempo validation to the TempoControl component - min 30, max 300 BPM"
```

Vague:

```text
"Make the tempo better"
```

### Request Planning for Complex Tasks

```text
"Before implementing, create a plan for adding preset management"
```

### Use the Todo System

Claude Code automatically uses TodoWrite for multi-step tasks. You can reference it:

```text
"What's left on the todo list?"
"Mark the audio engine as complete and move to UI components"
```

### Leverage Context

Claude Code has **unlimited context** through automatic summarization:

```text
"Remember the audio timing issue we discussed earlier? Apply that fix to the AudioEngine class"
```

### Iterate Freely

Don't try to specify everything upfront:

```text
User: "Add a play button"
Claude: [Adds basic button]
User: "Make it bigger and centered"
Claude: [Updates styling]
User: "Add a pause icon when playing"
Claude: [Adds state-based icon]
```

## Debugging and Troubleshooting

### Check Agent Status

```text
"What agents are currently running?"
"/tasks" (shows all background tasks)
```

### Cancel Long-Running Agents

```text
"Cancel the explore agent"
[Claude uses KillShell if needed]
```

### Review Agent Output

```text
"What did the Plan agent find?"
[Claude retrieves agent results]
```

### MCP Issues

```text
"/mcp-health" (verifies all MCP servers are working)
"What MCP tools are available?"
```

## Working with This Repository

### Initial Setup

```text
"Help me set up the dev environment"
[Claude runs pnpm install, verifies tools]
```

### Running Development Server

```text
"Start the dev server"
[Claude runs pnpm run dev in background]
[Claude provides localhost URL]
```

### Before Committing

```text
"Run all quality checks"
[Claude runs lint, format:check, docs:check, build]
[Claude reports any failures]
```

### Creating Commits

```text
"Create a commit for the audio engine implementation"
[Claude reviews changes with git diff]
[Claude creates descriptive commit message]
[Claude commits with proper attribution]
```

### Creating Pull Requests

```text
"Create a PR for this feature"
[Claude analyzes all commits in branch]
[Claude generates comprehensive PR description]
[Claude creates PR with gh CLI]
```

## Advanced: Custom Skills

You can create custom skills for repetitive workflows. Skills are stored in:

```text
~/.config/claude-code/skills/
```

### Example Skill: Check Metronome Timing

```markdown
# check-timing skill

Run the metronome timing validation:

1. Build the project
2. Run timing tests
3. Report inter-click interval variance
```

Invoke with: `/check-timing`

## Further Reading

- **Official Docs:** <https://docs.anthropic.com/claude/docs/claude-code>
- **Agent SDK:** <https://github.com/anthropics/anthropic-sdk-typescript>
- **MCP Documentation:** <https://modelcontextprotocol.io>
- **Skills Guide:** Use `/skill-creator` skill for interactive tutorial

## Getting Help

- **General help:** Type `/help` in Claude Code
- **Feature questions:** "How do I [task] with Claude Code?"
- **Bug reports:** <https://github.com/anthropics/claude-code/issues>

---

**Remember:** Claude Code is designed for **autonomous execution**. Instead of requesting autocomplete suggestions, describe what you want to achieve and let Claude handle the implementation details. Use agents for complex tasks, and iterate freely—context is preserved throughout the conversation.
