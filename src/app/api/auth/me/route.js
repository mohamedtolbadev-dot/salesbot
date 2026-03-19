import { getUserFromRequest } from "@/lib/auth"
import { successResponse, unauthorizedResponse } from "@/lib/response"

export async function GET(request) {
  const user = await getUserFromRequest(request)
  if (!user) return unauthorizedResponse()

  return successResponse({
    id: user.id,
    name: user.name,
    email: user.email,
    storeName: user.storeName,
    plan: user.plan,
    agent: user.agent ? {
      id: user.agent.id,
      name: user.agent.name,
      domain: user.agent.domain,
      style: user.agent.style,
      language: user.agent.language,
      isActive: user.agent.isActive,
    } : null,
  })
}
