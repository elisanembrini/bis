export type HealthState = "loading" | "ok" | "error";

type HealthQueryState = {
  isPending: boolean;
  isError: boolean;
};

export const toHealthState = ({ isPending, isError }: HealthQueryState): HealthState => {
  if (isError) {
    return "error";
  }
  if (isPending) {
    return "loading";
  }
  return "ok";
};
