# AI Community Moderator

An AI-powered GitHub Action that helps moderate community interactions by enforcing contributing guidelines and codes of conduct.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [How it Works](#how-it-works)
- [Configuration](#configuration)
- [Examples](#examples)
- [Moderation Actions](#moderation-actions)
- [Permissions](#permissions)
- [Community Health Files](#community-health-files)
- [Inputs and Outputs](#inputs-and-outputs)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Security Considerations](#security-considerations)
- [Limitations](#limitations)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Automated Moderation**: Uses GitHub Models with OpenAI GPT-4.1 to analyze issues, pull requests, discussions, and comments
- **Context-Aware**: Leverages your repository's contributing guidelines and code of conduct
- **Multiple Actions**: Can post helpful comments, hide inappropriate content, or lock discussions
- **Configurable**: Adjustable severity thresholds and moderation actions
- **Polite but Firm**: Maintains a helpful tone while enforcing community standards

## Getting Started

### Prerequisites

Before using the AI Community Moderator, ensure you have:

1. **GitHub Models Access**: Your repository must have access to GitHub Models
2. **Proper Permissions**: Your GitHub token needs the required permissions (see [Permissions](#permissions))
3. **Community Guidelines**: While optional, having community health files enhances moderation accuracy

### Quick Setup

1. **Create a workflow file** in your repository at `.github/workflows/moderate.yml`:

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
     discussion:
       types: [created]
     discussion_comment:
       types: [created]

   jobs:
     moderate:
       runs-on: ubuntu-latest
       permissions:
         contents: read
         issues: write
         pull-requests: write
         discussions: write
         models: read
       steps:
         - uses: benbalter/ai-community-moderator@v1
           with:
             github-token: ${{ secrets.GITHUB_TOKEN }}
   ```

2. **Commit and push** the workflow file to your repository

3. **Test the setup** by creating a test issue or comment

4. **Monitor the action** in your repository's Actions tab

### Basic Configuration

The action works out of the box with default settings, but you can customize its behavior:

```yaml
- uses: benbalter/ai-community-moderator@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    severity-threshold: 5 # Adjust sensitivity (1-10)
    model: openai/gpt-4.1 # Choose AI model
```

## How it Works

The AI Community Moderator follows this process for each community interaction:

1. **Event Trigger**: Responds to issues, pull requests, comments, and discussions
2. **Context Gathering**: Collects relevant information including:
   - The content being moderated
   - Repository community health files (CODE_OF_CONDUCT.md, CONTRIBUTING.md, etc.)
   - Recent conversation history for context
3. **AI Analysis**: Uses GitHub Models to analyze content against community standards
4. **Decision Making**: Determines severity (1-10 scale) and appropriate action
5. **Action Execution**: Takes appropriate moderation action based on severity threshold
6. **Logging**: Records decisions and actions for transparency

### AI Decision Process

The AI evaluates content based on:

- **Community Guidelines**: Your repository's contributing guidelines and code of conduct
- **Context**: Conversation history and interaction patterns
- **Tone and Intent**: Whether content is constructive or harmful
- **Policy Violations**: Spam, harassment, off-topic content, etc.

## Usage

## Configuration

### Severity Threshold

The `severity-threshold` input controls when actions are taken. The AI rates content on a scale of 1-10:

- **1-3**: Minor issues, usually no action taken
- **4-6**: Moderate issues, may warrant educational comments
- **7-8**: Significant issues, may require hiding content or suggestions
- **9-10**: Severe violations, may require locking or limiting interactions

**Examples:**

- `severity-threshold: 3` = Strict moderation (takes action on minor issues)
- `severity-threshold: 5` = Balanced moderation (default)
- `severity-threshold: 8` = Lenient moderation (only acts on severe issues)

### GitHub Models Configuration

This action uses GitHub Models for AI inference with automatic authentication:

**Requirements:**

1. Repository must have access to GitHub Models
2. Workflow must include `models: read` permission
3. Uses GitHub token for authentication with `https://models.github.ai/inference`

**Supported Models:**

- `openai/gpt-4.1` (default) - Most capable, slower
- `openai/gpt-3.5-turbo` - Faster, less capable
- Other OpenAI-compatible models supported by GitHub Models

### Advanced Configuration

```yaml
- uses: benbalter/ai-community-moderator@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    severity-threshold: 6
    model: openai/gpt-4.1
    openai-base-url: https://models.github.ai/inference
```

## Examples

### Basic Setup

Perfect for most repositories with standard moderation needs:

```yaml
- uses: benbalter/ai-community-moderator@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Strict Moderation

For repositories requiring tight community standards (e.g., educational, corporate):

```yaml
- uses: benbalter/ai-community-moderator@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    severity-threshold: 3
```

This configuration will:

- Take action on minor infractions
- Provide more educational guidance
- Maintain stricter community standards

### Lenient Moderation

For open-source projects with more relaxed community standards:

```yaml
- uses: benbalter/ai-community-moderator@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    severity-threshold: 8
```

This configuration will:

- Only act on severe violations
- Allow more casual discussion
- Focus on obvious policy violations

### High-Traffic Repository

For repositories with many contributors and interactions:

```yaml
name: AI Community Moderator

on:
  issues:
    types: [opened, edited]
  pull_request:
    types: [opened, edited]
  issue_comment:
    types: [created, edited]
  pull_request_review_comment:
    types: [created, edited]
  discussion:
    types: [created, edited]
  discussion_comment:
    types: [created, edited]

jobs:
  moderate:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
      pull-requests: write
      discussions: write
      models: read
    steps:
      - uses: benbalter/ai-community-moderator@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          severity-threshold: 5
          model: openai/gpt-4.1
```

## Moderation Actions

The AI can take several types of actions based on the content analysis:

### 1. **Comment**

- **When**: Educational opportunities or minor guideline clarifications needed
- **Action**: Posts a helpful, educational comment explaining community standards
- **Example**: "Thanks for your contribution! To help maintain our community standards, please consider..."

### 2. **Suggest**

- **When**: Content needs improvement but shows good intent
- **Action**: Provides constructive suggestions for improvement
- **Example**: Suggesting better formatting, clearer communication, or additional context

### 3. **Hide**

- **When**: Content violates community standards significantly
- **Action**: Hides inappropriate comments from public view
- **Note**: Requires repository admin permissions

### 4. **Lock**

- **When**: Discussions become unproductive or heated
- **Action**: Locks issues, PRs, or discussions to prevent further comments
- **Note**: Can be unlocked manually by maintainers

### 5. **None**

- **When**: Content meets community standards
- **Action**: No action taken, normal processing continues

## Permissions

The action requires the following GitHub permissions:

```yaml
permissions:
  contents: read # To read community health files
  issues: write # To comment on and lock issues
  pull-requests: write # To comment on and lock PRs
  discussions: write # To moderate discussions (if used)
  models: read # To access GitHub Models for AI inference
```

### Permission Details

- **`contents: read`**: Allows reading repository files like CONTRIBUTING.md and CODE_OF_CONDUCT.md
- **`issues: write`**: Enables commenting on and locking issues
- **`pull-requests: write`**: Enables commenting on and locking pull requests
- **`discussions: write`**: Required only if moderating GitHub Discussions
- **`models: read`**: Essential for accessing GitHub Models AI service

## Community Health Files

The action automatically detects and uses community health files to provide context for moderation decisions:

### Automatically Detected Files

- **`.github/CONTRIBUTING.md`** or **`CONTRIBUTING.md`** - Contribution guidelines
- **`.github/CODE_OF_CONDUCT.md`** or **`CODE_OF_CONDUCT.md`** - Community standards
- **`.github/ISSUE_TEMPLATE.md`** - Issue submission guidelines

### How They're Used

- **Context Enhancement**: Files provide specific guidelines for the AI to reference
- **Consistent Enforcement**: Ensures moderation aligns with your documented standards
- **Educational Comments**: AI can reference specific sections when providing guidance

### Best Practices

1. **Keep files up-to-date**: Regular review ensures accurate moderation
2. **Be specific**: Clear guidelines help the AI make better decisions
3. **Include examples**: Concrete examples improve AI understanding

## Inputs and Outputs

### Inputs

| Input                | Description                                                  | Required | Default                              |
| -------------------- | ------------------------------------------------------------ | -------- | ------------------------------------ |
| `github-token`       | GitHub token for API access and GitHub Models authentication | Yes      | `${{ github.token }}`                |
| `openai-base-url`    | GitHub Models base URL                                       | No       | `https://models.github.ai/inference` |
| `model`              | AI model to use for moderation                               | No       | `openai/gpt-4.1`                     |
| `severity-threshold` | Severity threshold for taking action (1-10)                  | No       | `5`                                  |

### Outputs

| Output         | Description                      | Example                                                                      |
| -------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| `action-taken` | Type of moderation action taken  | `comment`, `hide`, `lock`, `suggest`, `none`                                 |
| `reason`       | Reason for the moderation action | `"Content violates community guidelines regarding respectful communication"` |

### Using Outputs

```yaml
- uses: benbalter/ai-community-moderator@v1
  id: moderate
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}

- name: Log moderation result
  run: |
    echo "Action taken: ${{ steps.moderate.outputs.action-taken }}"
    echo "Reason: ${{ steps.moderate.outputs.reason }}"
```

## Troubleshooting

### Common Issues

#### "GitHub Models access denied"

**Problem**: Action fails with authentication or access errors
**Solutions**:

1. Verify `models: read` permission is included in workflow
2. Ensure repository has GitHub Models access
3. Check that `github-token` input is correctly set
4. Verify token has necessary scopes

#### "No action taken on obvious violations"

**Problem**: AI doesn't moderate content that should be flagged
**Solutions**:

1. Lower the `severity-threshold` (try 3-4 instead of 5)
2. Add or update community health files for better context
3. Check if content type is supported (issues, PRs, comments, discussions)

#### "Too many false positives"

**Problem**: AI flags appropriate content as violations
**Solutions**:

1. Increase the `severity-threshold` (try 7-8 instead of 5)
2. Review and refine community health files
3. Consider using a different model

#### Action timeout or slow response

**Problem**: Action takes too long or times out
**Solutions**:

1. Switch to a faster model like `openai/gpt-3.5-turbo`
2. Check GitHub Models service status
3. Reduce context by limiting community health file size

### Debug Mode

Enable debug logging by adding this to your workflow:

```yaml
- uses: benbalter/ai-community-moderator@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
  env:
    ACTIONS_STEP_DEBUG: true
```

### Getting Help

1. Check the [Actions tab](../../actions) for detailed logs
2. Review this troubleshooting section
3. Open an issue with:
   - Workflow configuration
   - Error messages
   - Expected vs actual behavior

## FAQ

### General Questions

**Q: How much does it cost to use this action?**
A: The action itself is free, but GitHub Models usage may have costs depending on your GitHub plan and usage volume. Check GitHub's pricing for GitHub Models.

**Q: What languages does the AI support?**
A: The AI can moderate content in multiple languages, but it's most effective with English. Non-English content may have reduced accuracy.

**Q: Can I use this with private repositories?**
A: Yes, the action works with private repositories as long as they have GitHub Models access.

### Technical Questions

**Q: Which events trigger the action?**
A: By default: `issues.opened`, `pull_request.opened`, `issue_comment.created`, `pull_request_review_comment.created`, `discussion.created`, `discussion_comment.created`. You can customize this in your workflow.

**Q: Can I customize the AI prompts?**
A: Not directly through configuration. The prompts are designed to work with community health files for customization.

**Q: How does the AI understand my community standards?**
A: It reads your CODE_OF_CONDUCT.md, CONTRIBUTING.md, and other community health files to understand your specific guidelines.

**Q: Can I review actions before they're taken?**
A: Not automatically, but you can monitor the Actions tab and manually review/reverse any actions if needed.

### Privacy Questions

**Q: What data is sent to the AI service?**
A: Only the content being moderated and relevant community health files. No sensitive repository data or user information is shared unnecessarily.

**Q: Is content stored by the AI service?**
A: This depends on GitHub Models' data retention policy. Check GitHub's privacy policy for details.

**Q: Can I run this without external AI services?**
A: No, the action requires GitHub Models for AI inference capabilities.

## Security Considerations

### Data Privacy

- **Content Analysis**: Only public content and community health files are analyzed
- **No Sensitive Data**: Private repository contents, secrets, and personal information are not accessed
- **GitHub Models**: Content is processed through GitHub's managed AI service with their privacy protections

### Access Control

- **Minimal Permissions**: Action requests only necessary permissions for operation
- **GitHub Token**: Uses your repository's GitHub token, not external API keys
- **Scope Limitation**: Cannot access resources outside the configured permissions

### Action Security

- **Source Code**: Open source and auditable
- **Dependency Management**: Regular security updates for dependencies
- **Signed Releases**: Future releases will be signed for integrity verification

### Best Practices

1. **Review Permissions**: Only grant necessary permissions to the workflow
2. **Monitor Actions**: Regularly review action logs and decisions
3. **Community Health**: Keep community guidelines up to date and specific
4. **Incident Response**: Have a plan for handling false positives or negatives

### Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. **Don't** open a public issue
2. **Do** email security concerns to the maintainer
3. **Include** detailed reproduction steps and potential impact

## Limitations

### Technical Limitations

- **Rate Limits**: Subject to GitHub API and GitHub Models rate limits
- **Processing Time**: AI analysis adds latency to comment posting
- **Language Support**: Most effective with English content
- **Context Size**: Limited by AI model context window (~8K tokens)

### Moderation Limitations

- **Not Perfect**: AI may miss subtle violations or flag appropriate content
- **Context Dependent**: Effectiveness depends on quality of community health files
- **Cultural Nuance**: May not understand all cultural contexts or humor
- **Evolving Standards**: Community standards may change faster than AI understanding

### Functional Limitations

- **Retroactive Moderation**: Only processes new content, not existing content
- **Edit Detection**: Limited support for content edits (depends on workflow triggers)
- **Complex Violations**: May struggle with complex, multi-message violations
- **Appeals Process**: No built-in appeals or review process

### Scope Limitations

- **Repository Only**: Cannot moderate across multiple repositories
- **Public Content**: Primarily designed for public community interactions
- **GitHub Features**: Limited to GitHub's supported interaction types

### Recommendations

1. **Human Oversight**: Always maintain human moderator involvement
2. **Regular Review**: Periodically review AI decisions and adjust thresholds
3. **Clear Guidelines**: Maintain clear, specific community health documents
4. **Feedback Loop**: Encourage community feedback on moderation decisions

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

### Linting

Code style is enforced using ESLint:

```bash
npm run lint          # Check for linting issues
npm run lint:fix      # Automatically fix issues
```

### Packaging

```bash
npm run package
```

## Contributing

We welcome contributions to improve the AI Community Moderator! Here are ways you can help:

### Quick Links

- [Contributing Guidelines](.github/CONTRIBUTING.md) - Detailed contribution instructions
- [Issue Tracker](../../issues) - Report bugs or suggest features
- [Discussions](../../discussions) - Ask questions or discuss ideas

### Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. **Install** dependencies: `npm install`
4. **Build** the project: `npm run build`
5. **Test** your changes: `npm test`

### Development Workflow

1. Create a feature branch from `main`
2. Make your changes with tests
3. Run the full test suite: `npm run all`
4. Submit a pull request with clear description

### Areas for Contribution

- **Documentation**: Improve clarity, add examples, fix typos
- **Testing**: Add test cases, improve coverage
- **Features**: New moderation actions, better AI prompts
- **Bug Fixes**: Address issues from the issue tracker

## License

MIT License - see [LICENSE](LICENSE) file for details.

This project is open source and welcomes contributions from the community.
