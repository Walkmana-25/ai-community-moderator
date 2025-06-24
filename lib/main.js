"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const moderator_1 = require("./moderator");
async function run() {
  try {
    // Get inputs
    const token = core.getInput("github-token", { required: true });
    const openaiBaseUrl =
      core.getInput("openai-base-url") || "https://models.github.ai/inference";
    const model = core.getInput("model") || "openai/gpt-4.1";
    const severityThreshold = parseInt(
      core.getInput("severity-threshold") || "5",
      10,
    );
    // Initialize moderator
    const moderator = new moderator_1.Moderator({
      githubToken: token,
      openaiApiKey: token, // Use GitHub token for GitHub Models authentication
      openaiBaseUrl,
      model,
      severityThreshold,
    });
    // Get event context
    const context = github.context;
    // Process the event
    const result = await moderator.processEvent(context);
    // Set outputs
    core.setOutput("action-taken", result.actionTaken);
    core.setOutput("reason", result.reason);
    // Use warning if action was taken, info if no action was taken
    if (result.actionTaken !== "none") {
      core.warning(
        `Moderation action taken: ${result.actionTaken} - ${result.reason}`,
      );
    } else {
      core.info(
        `Moderation completed: ${result.actionTaken} - ${result.reason}`,
      );
    }
  } catch (error) {
    core.setFailed(
      `Action failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
run();
//# sourceMappingURL=main.js.map
