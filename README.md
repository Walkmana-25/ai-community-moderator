# AI Community Moderator

An AI-powered GitHub Action that helps moderate community interactions by enforcing contributing guidelines and codes of conduct.

## Features

- **Automated Moderation**: Uses GitHub Models with OpenAI GPT-4.1 to analyze issues, pull requests, and comments
- **Context-Aware**: Leverages your repository's contributing guidelines and code of conduct
- **Multiple Actions**: Can post helpful comments, hide inappropriate content, or lock discussions
- **Configurable**: Adjustable severity thresholds and moderation actions
- **Polite but Firm**: Maintains a helpful tone while enforcing community standards

## Usage

Create a workflow file in your repository (e.g., `.github/workflows/moderate.yml`):

```yaml
name: AI Community Moderator

on:
  issues:
    types: [opened]
  pull_request:
    types: [opened]
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]

jobs:
  moderate:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
      pull-requests: write
      models: read  # Required for GitHub Models access
    steps:
      - uses: benbalter/ai-community-moderator@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          severity-threshold: 5
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `github-token` | GitHub token for API access and GitHub Models authentication | Yes | `${{ github.token }}` |
| `openai-base-url` | GitHub Models base URL | No | `https://models.github.ai/inference` |
| `model` | AI model to use for moderation | No | `openai/gpt-4.1` |
| `severity-threshold` | Severity threshold for taking action (1-10) | No | `5` |

## Outputs

| Output | Description |
|--------|-------------|
| `action-taken` | Type of moderation action taken |
| `reason` | Reason for the moderation action |

## Community Health Files

The action automatically looks for and uses the following community health files to provide context:

- `.github/CONTRIBUTING.md` or `CONTRIBUTING.md`
- `.github/CODE_OF_CONDUCT.md` or `CODE_OF_CONDUCT.md`
- `.github/ISSUE_TEMPLATE.md`

## Moderation Actions

The AI can take several types of actions based on the content:

1. **Comment**: Post a helpful, educational comment
2. **Suggest**: Provide constructive suggestions for improvement
3. **Hide**: Hide inappropriate comments (for severe violations)
4. **Lock**: Lock discussions that are getting out of hand
5. **None**: No action needed

## Configuration

### Severity Threshold

The `severity-threshold` input controls when actions are taken. The AI rates content on a scale of 1-10:

- 1-3: Minor issues, usually no action
- 4-6: Moderate issues, may warrant educational comments
- 7-8: Significant issues, may require hiding or suggestions
- 9-10: Severe violations, may require locking or limiting

### GitHub Models

This action uses GitHub Models for AI inference capabilities. Authentication is handled automatically using your GitHub token with the following requirements:

1. Your workflow must include the `models: read` permission
2. Your repository must have access to GitHub Models
3. The action uses the GitHub token to authenticate with the models service at `https://models.github.ai/inference`

## Permissions

The action requires the following permissions:

```yaml
permissions:
  contents: read        # To read community health files
  issues: write         # To comment on and lock issues
  pull-requests: write  # To comment on and lock PRs
  models: read          # To access GitHub Models for AI inference
```

## Examples

### Basic Setup

```yaml
- uses: benbalter/ai-community-moderator@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Strict Moderation

```yaml
- uses: benbalter/ai-community-moderator@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    severity-threshold: 3
```

### Lenient Moderation

```yaml
- uses: benbalter/ai-community-moderator@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    severity-threshold: 8
```

## Development

### Building

```bash
npm install
npm run build
```

### Testing

```bash
npm test
```

### Packaging

```bash
npm run package
```

## License

MIT
