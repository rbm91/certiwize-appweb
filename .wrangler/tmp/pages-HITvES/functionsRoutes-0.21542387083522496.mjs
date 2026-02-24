import { onRequestPost as __api_analyze_doc_js_onRequestPost } from "/home/salah/Desktop/Certiwize/certiwize-app/functions/api/analyze-doc.js"
import { onRequestPost as __api_chat_js_onRequestPost } from "/home/salah/Desktop/Certiwize/certiwize-app/functions/api/chat.js"
import { onRequestPost as __api_generate_convention_js_onRequestPost } from "/home/salah/Desktop/Certiwize/certiwize-app/functions/api/generate-convention.js"
import { onRequestPost as __api_generate_project_doc_js_onRequestPost } from "/home/salah/Desktop/Certiwize/certiwize-app/functions/api/generate-project-doc.js"
import { onRequestPost as __api_generate_training_pdf_js_onRequestPost } from "/home/salah/Desktop/Certiwize/certiwize-app/functions/api/generate-training-pdf.js"
import { onRequestPost as __api_trigger_workflow_js_onRequestPost } from "/home/salah/Desktop/Certiwize/certiwize-app/functions/api/trigger-workflow.js"

export const routes = [
    {
      routePath: "/api/analyze-doc",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_analyze_doc_js_onRequestPost],
    },
  {
      routePath: "/api/chat",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_chat_js_onRequestPost],
    },
  {
      routePath: "/api/generate-convention",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_generate_convention_js_onRequestPost],
    },
  {
      routePath: "/api/generate-project-doc",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_generate_project_doc_js_onRequestPost],
    },
  {
      routePath: "/api/generate-training-pdf",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_generate_training_pdf_js_onRequestPost],
    },
  {
      routePath: "/api/trigger-workflow",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_trigger_workflow_js_onRequestPost],
    },
  ]