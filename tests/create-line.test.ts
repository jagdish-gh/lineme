import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  toCreateLineRpcParams,
  validateCreateLine
} from "@/lib/lines/create-line";

const validCreateLineInput = {
  allowPause: true,
  autoNotify: true,
  capacity: "",
  customQueueType: "",
  estimatedMinutes: "",
  joinQuestions: [
    {
      id: "question-1",
      label: "Full name",
      options: [],
      required: true,
      type: "text"
    }
  ],
  lineName: "General consultation",
  location: "Counter 4",
  queueType: "clinic"
} as const;

describe("create line flow", () => {
  it("accepts a valid line and normalizes create_line RPC params", () => {
    const result = validateCreateLine(validCreateLineInput);

    assert.equal(result.success, true);
    if (!result.success) return;

    assert.deepEqual(toCreateLineRpcParams(result.data), {
      p_allow_pause: true,
      p_auto_notify: true,
      p_custom_line_type: null,
      p_daily_capacity: null,
      p_estimated_service_minutes: null,
      p_line_type: "clinic",
      p_location: "Counter 4",
      p_name: "General consultation",
      p_questions: [
        {
          label: "Full name",
          options: [],
          required: true,
          type: "text"
        }
      ]
    });
  });

  it("rejects invalid line names and invalid choice questions", () => {
    assert.deepEqual(validateCreateLine({ ...validCreateLineInput, lineName: "A" }), {
      code: "invalid_line_name",
      success: false
    });

    assert.deepEqual(
      validateCreateLine({
        ...validCreateLineInput,
        joinQuestions: [
          {
            id: "question-1",
            label: "Department",
            options: ["Only one"],
            required: false,
            type: "choice"
          }
        ]
      }),
      {
        code: "invalid_questions",
        success: false
      }
    );
  });

  it("keeps backend-only service estimate and capacity validation intact", () => {
    assert.deepEqual(
      validateCreateLine({
        ...validCreateLineInput,
        capacity: 3
      }),
      {
        code: "invalid_capacity",
        success: false
      }
    );

    assert.deepEqual(
      validateCreateLine({
        ...validCreateLineInput,
        estimatedMinutes: 90
      }),
      {
        code: "invalid_estimate",
        success: false
      }
    );
  });
});
