export type MemberLike = {
  id: string;
  [key: string]: unknown;
};

export declare function removeMemberById<T extends MemberLike>(
  members: T[],
  memberId: string
): T[];

