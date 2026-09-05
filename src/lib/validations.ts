import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .max(255, "Email is too long")
    .email("Please enter a valid email"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password cannot exceed 128 characters")
    .min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .max(255, "Email is too long")
      .email("Please enter a valid email"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password cannot exceed 128 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password").max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const threatSearchSchema = z.object({
  query: z
    .string()
    .min(1, "Search query is required")
    .max(500, "Search query is too long"),
  type: z.enum(["ip", "domain", "hash", "url", "cve"]).optional(),
});

export const reportSchema = z.object({
  title: z
    .string()
    .min(1, "Report title is required")
    .max(300, "Title is too long"),
  type: z.enum(["investigation", "threat_analysis", "incident"]),
  summary: z.string().max(10000, "Summary is too long").optional().default(""),
  findings: z
    .array(
      z.object({
        title: z.string().min(1).max(300),
        description: z.string().min(1).max(5000),
        severity: z.enum(["critical", "high", "medium", "low", "info"]),
        evidence: z.string().max(10000).optional().default(""),
      })
    )
    .max(100, "Too many findings in a single report")
    .optional()
    .default([]),
  iocs: z
    .array(
      z.object({
        type: z.enum(["ip", "domain", "hash", "url", "email", "cve"]),
        value: z.string().min(1).max(2048),
        context: z.string().max(1000).optional().default(""),
      })
    )
    .max(200, "Too many IOCs in a single report")
    .optional()
    .default([]),
  threatEvidence: z
    .array(
      z.object({
        source: z.string().min(1).max(200),
        description: z.string().min(1).max(5000),
        severity: z.enum(["critical", "high", "medium", "low", "info"]),
        date: z.string().max(100).optional().default(""),
      })
    )
    .max(100, "Too much threat evidence in a single report")
    .optional()
    .default([]),
  riskScore: z.number().min(0).max(100).optional().default(0),
  status: z.enum(["draft", "finalized"]).optional().default("draft"),
});

export const settingsSchema = z.object({
  theme: z.enum(["dark", "light", "system"]).optional(),
  apiKeys: z
    .object({
      virusTotal: z.string().optional(),
      shodan: z.string().optional(),
      abuseIPDB: z.string().optional(),
    })
    .optional(),
  notifications: z
    .object({
      email: z.boolean().optional(),
      browser: z.boolean().optional(),
      digest: z.boolean().optional(),
    })
    .optional(),
});

export const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  image: z.string().url().optional().or(z.literal("")),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ThreatSearchInput = z.infer<typeof threatSearchSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
