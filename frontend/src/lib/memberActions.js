export function removeMemberById(members, memberId) {
  return members.filter((member) => member.id !== memberId);
}

