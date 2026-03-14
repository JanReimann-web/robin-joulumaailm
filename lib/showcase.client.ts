export class ShowcaseClientError extends Error {
  code: string

  constructor(code: string) {
    super(code)
    this.code = code
  }
}

type SetShowcaseStateInput = {
  idToken: string
  listId: string
  publish: boolean
}

type FetchShowcaseListIdsResult = {
  canManageGallery: boolean
  listIds: string[]
}

type SetShowcaseStateResult = {
  listId: string
  showcased: boolean
}

const parseShowcaseError = async (response: Response) => {
  const payload = await response
    .json()
    .catch(() => ({ error: 'showcase_request_failed' })) as { error?: string }

  throw new ShowcaseClientError(payload.error ?? 'showcase_request_failed')
}

export const fetchShowcaseListIds = async (
  idToken: string
): Promise<FetchShowcaseListIdsResult> => {
  const response = await fetch('/api/showcase', {
    headers: {
      authorization: `Bearer ${idToken}`,
    },
  })

  if (!response.ok) {
    await parseShowcaseError(response)
  }

  const payload = await response.json() as Partial<FetchShowcaseListIdsResult>

  return {
    canManageGallery: payload.canManageGallery === true,
    listIds: Array.isArray(payload.listIds) ? payload.listIds : [],
  }
}

export const setShowcaseListState = async (
  input: SetShowcaseStateInput
): Promise<SetShowcaseStateResult> => {
  const response = await fetch('/api/showcase', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${input.idToken}`,
    },
    body: JSON.stringify({
      listId: input.listId,
      publish: input.publish,
    }),
  })

  if (!response.ok) {
    await parseShowcaseError(response)
  }

  return await response.json() as SetShowcaseStateResult
}
