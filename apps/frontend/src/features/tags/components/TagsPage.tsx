import { useQuery, useQueryClient } from "@tanstack/react-query";

import { $api } from "../../../api/client";
import { errorCodeOf } from "../../../api/errors";
import { FormError } from "../../../components/FormError";
import { PageContainer } from "../../../components/PageContainer";
import { tagsQueryOptions } from "../queries";
import { TagManager } from "./TagManager";

export function TagsPage() {
  const queryClient = useQueryClient();
  const tags = useQuery(tagsQueryOptions());
  const refresh = () => queryClient.invalidateQueries();
  const createTag = $api.useMutation("post", "/tags", { onSuccess: refresh });
  const deleteTag = $api.useMutation("delete", "/tags/{tag_id}", { onSuccess: refresh });
  const failed = createTag.isError ? createTag.error : deleteTag.isError ? deleteTag.error : null;

  if (tags.isError) {
    return <FormError code={errorCodeOf(tags.error)} />;
  }

  return (
    <PageContainer>
      <TagManager
        tags={tags.data ?? []}
        onCreate={(name) => createTag.mutate({ body: { name } })}
        onDelete={(tag) => deleteTag.mutate({ params: { path: { tag_id: tag.id } } })}
        isCreating={createTag.isPending}
        deletingTagId={deleteTag.isPending ? deleteTag.variables.params.path.tag_id : undefined}
        errorCode={failed === null ? undefined : errorCodeOf(failed)}
      />
    </PageContainer>
  );
}
