import test from "node:test";
import assert from "node:assert/strict";

import { removeMemberById } from "../src/lib/memberActions.js";

test("removeMemberById removes the matching member from the list", () => {
  const members = [
    { id: "one", full_name: "One" },
    { id: "two", full_name: "Two" },
    { id: "three", full_name: "Three" },
  ];

  const result = removeMemberById(members, "two");

  assert.deepEqual(result, [
    { id: "one", full_name: "One" },
    { id: "three", full_name: "Three" },
  ]);
});
