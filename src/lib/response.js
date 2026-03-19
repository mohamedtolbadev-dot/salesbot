// دوال موحدة للردود
export function successResponse(data, status = 200) {
  return Response.json(
    { success: true, data },
    { status }
  )
}

export function errorResponse(message, status = 400) {
  return Response.json(
    { success: false, error: message },
    { status }
  )
}

export function unauthorizedResponse() {
  return Response.json(
    { success: false, error: "غير مصرح" },
    { status: 401 }
  )
}
