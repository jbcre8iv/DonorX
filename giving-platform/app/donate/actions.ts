"use server";

// redirect import removed - not currently used
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getStripeServer } from "@/lib/stripe/client";
import { config } from "@/lib/config";
import type { RecurringInterval } from "@/types/database";

async function isSimulationModeEnabled(): Promise<boolean> {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("system_settings")
      .select("value")
      .eq("key", "simulation_mode")
      .single();

    if (error || !data) {
      return false;
    }

    return data.value?.enabled === true;
  } catch {
    return false;
  }
}

export interface AllocationInput {
  type: "nonprofit" | "category";
  targetId: string;
  targetName: string;
  percentage: number;
}

export interface CreateCheckoutResult {
  success: boolean;
  url?: string;
  error?: string;
}

export type DonationFrequency = "one-time" | RecurringInterval;

// Template types
export interface TemplateItem {
  type: "nonprofit" | "category";
  targetId: string;
  targetName: string;
  percentage: number;
  isLocked?: boolean;
}

export interface DonationTemplate {
  id: string;
  name: string;
  description?: string;
  amountCents?: number;
  frequency?: DonationFrequency;
  items: TemplateItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SaveTemplateResult {
  success: boolean;
  template?: DonationTemplate;
  error?: string;
}

export interface LoadTemplatesResult {
  success: boolean;
  templates?: DonationTemplate[];
  error?: string;
}

// Draft types
export interface DraftAllocation {
  type: "nonprofit" | "category";
  targetId: string;
  targetName: string;
  percentage: number;
}

export interface DonationDraft {
  id: string;
  amountCents: number;
  frequency: DonationFrequency;
  allocations: DraftAllocation[];
  updatedAt: string;
}

export interface DraftResult {
  success: boolean;
  draft?: DonationDraft;
  error?: string;
}

export async function saveTemplate(
  name: string,
  items: TemplateItem[],
  description?: string,
  amountCents?: number,
  frequency?: DonationFrequency
): Promise<SaveTemplateResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to save templates" };
  }

  if (!name.trim()) {
    return { success: false, error: "Template name is required" };
  }

  if (items.length === 0) {
    return { success: false, error: "At least one allocation is required" };
  }

  const totalPercentage = items.reduce((sum, item) => sum + item.percentage, 0);
  if (totalPercentage !== 100) {
    return { success: false, error: "Allocations must total 100%" };
  }

  try {
    // Create the template
    const { data: template, error: templateError } = await supabase
      .from("donation_templates")
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        amount_cents: amountCents || null,
        frequency: frequency || null,
      })
      .select()
      .single();

    if (templateError || !template) {
      console.error("Failed to create template:", templateError);
      return { success: false, error: "Failed to save template" };
    }

    // Create the template items
    const templateItems = items.map((item) => ({
      template_id: template.id,
      type: item.type,
      target_id: item.targetId,
      target_name: item.targetName,
      percentage: item.percentage,
      is_locked: item.isLocked || false,
    }));

    const { error: itemsError } = await supabase
      .from("donation_template_items")
      .insert(templateItems);

    if (itemsError) {
      console.error("Failed to create template items:", itemsError);
      // Clean up the template
      await supabase.from("donation_templates").delete().eq("id", template.id);
      return { success: false, error: "Failed to save template items" };
    }

    return {
      success: true,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        amountCents: template.amount_cents,
        frequency: template.frequency,
        items,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
      },
    };
  } catch (error) {
    console.error("Save template error:", error);
    return { success: false, error: "Failed to save template" };
  }
}

export async function loadTemplates(): Promise<LoadTemplatesResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to view templates" };
  }

  try {
    // Fetch templates with their items
    const { data: templates, error: templatesError } = await supabase
      .from("donation_templates")
      .select(`
        id,
        name,
        description,
        amount_cents,
        frequency,
        created_at,
        updated_at,
        donation_template_items (
          type,
          target_id,
          target_name,
          percentage,
          is_locked
        )
      `)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (templatesError) {
      console.error("Failed to load templates:", templatesError);
      return { success: false, error: "Failed to load templates" };
    }

    const formattedTemplates: DonationTemplate[] = (templates || []).map((t: Record<string, unknown>) => ({
      id: t.id as string,
      name: t.name as string,
      description: t.description as string | undefined,
      amountCents: t.amount_cents as number | undefined,
      frequency: t.frequency as DonationFrequency | undefined,
      items: ((t.donation_template_items as Array<Record<string, unknown>>) || []).map((item) => ({
        type: item.type as "nonprofit" | "category",
        targetId: item.target_id as string,
        targetName: item.target_name as string,
        percentage: item.percentage as number,
        isLocked: item.is_locked as boolean | undefined,
      })),
      createdAt: t.created_at as string,
      updatedAt: t.updated_at as string,
    }));

    return { success: true, templates: formattedTemplates };
  } catch (error) {
    console.error("Load templates error:", error);
    return { success: false, error: "Failed to load templates" };
  }
}

export async function loadTemplateById(templateId: string): Promise<SaveTemplateResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to load templates" };
  }

  try {
    const { data: template, error: templateError } = await supabase
      .from("donation_templates")
      .select(`
        id,
        name,
        description,
        amount_cents,
        frequency,
        created_at,
        updated_at,
        donation_template_items (
          type,
          target_id,
          target_name,
          percentage,
          is_locked
        )
      `)
      .eq("id", templateId)
      .eq("user_id", user.id)
      .single();

    if (templateError || !template) {
      console.error("Failed to load template:", templateError);
      return { success: false, error: "Template not found or access denied" };
    }

    const formattedTemplate: DonationTemplate = {
      id: template.id as string,
      name: template.name as string,
      description: template.description as string | undefined,
      amountCents: template.amount_cents as number | undefined,
      frequency: template.frequency as DonationFrequency | undefined,
      items: ((template.donation_template_items as Array<Record<string, unknown>>) || []).map((item) => ({
        type: item.type as "nonprofit" | "category",
        targetId: item.target_id as string,
        targetName: item.target_name as string,
        percentage: item.percentage as number,
        isLocked: item.is_locked as boolean | undefined,
      })),
      createdAt: template.created_at as string,
      updatedAt: template.updated_at as string,
    };

    return { success: true, template: formattedTemplate };
  } catch (error) {
    console.error("Load template by ID error:", error);
    return { success: false, error: "Failed to load template" };
  }
}

export async function updateTemplate(
  templateId: string,
  name: string,
  items: TemplateItem[],
  description?: string,
  amountCents?: number,
  frequency?: DonationFrequency
): Promise<SaveTemplateResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to update templates" };
  }

  if (!name.trim()) {
    return { success: false, error: "Template name is required" };
  }

  if (items.length === 0) {
    return { success: false, error: "At least one allocation is required" };
  }

  const totalPercentage = items.reduce((sum, item) => sum + item.percentage, 0);
  if (totalPercentage !== 100) {
    return { success: false, error: "Allocations must total 100%" };
  }

  try {
    // Verify user owns the template
    const { data: existingTemplate, error: fetchError } = await supabase
      .from("donation_templates")
      .select("id")
      .eq("id", templateId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingTemplate) {
      return { success: false, error: "Template not found or access denied" };
    }

    // Update the template
    const { data: template, error: templateError } = await supabase
      .from("donation_templates")
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        amount_cents: amountCents || null,
        frequency: frequency || null,
      })
      .eq("id", templateId)
      .select()
      .single();

    if (templateError || !template) {
      console.error("Failed to update template:", templateError);
      return { success: false, error: "Failed to update template" };
    }

    // Delete existing items
    const { error: deleteError } = await supabase
      .from("donation_template_items")
      .delete()
      .eq("template_id", templateId);

    if (deleteError) {
      console.error("Failed to delete old template items:", deleteError);
      return { success: false, error: "Failed to update template items" };
    }

    // Insert new items
    const templateItems = items.map((item) => ({
      template_id: template.id,
      type: item.type,
      target_id: item.targetId,
      target_name: item.targetName,
      percentage: item.percentage,
      is_locked: item.isLocked || false,
    }));

    const { error: itemsError } = await supabase
      .from("donation_template_items")
      .insert(templateItems);

    if (itemsError) {
      console.error("Failed to create template items:", itemsError);
      return { success: false, error: "Failed to update template items" };
    }

    return {
      success: true,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        amountCents: template.amount_cents,
        frequency: template.frequency,
        items,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
      },
    };
  } catch (error) {
    console.error("Update template error:", error);
    return { success: false, error: "Failed to update template" };
  }
}

export async function deleteTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to delete templates" };
  }

  try {
    // Delete will cascade to template items due to foreign key
    const { error } = await supabase
      .from("donation_templates")
      .delete()
      .eq("id", templateId)
      .eq("user_id", user.id); // Ensure user owns the template

    if (error) {
      console.error("Failed to delete template:", error);
      return { success: false, error: "Failed to delete template" };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete template error:", error);
    return { success: false, error: "Failed to delete template" };
  }
}

export async function renameTemplate(
  templateId: string,
  newName: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to rename templates" };
  }

  if (!newName.trim()) {
    return { success: false, error: "Template name is required" };
  }

  try {
    const { error } = await supabase
      .from("donation_templates")
      .update({ name: newName.trim() })
      .eq("id", templateId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to rename template:", error);
      return { success: false, error: "Failed to rename template" };
    }

    return { success: true };
  } catch (error) {
    console.error("Rename template error:", error);
    return { success: false, error: "Failed to rename template" };
  }
}

// Draft functions for cross-device donation progress
export async function saveDraft(
  amountCents: number,
  frequency: DonationFrequency,
  allocations: DraftAllocation[]
): Promise<DraftResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to save drafts" };
  }

  try {
    // Upsert the draft (one per user)
    const { data: draft, error } = await supabase
      .from("donation_drafts")
      .upsert(
        {
          user_id: user.id,
          amount_cents: amountCents,
          frequency,
          allocations: JSON.stringify(allocations),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Failed to save draft:", error);
      return { success: false, error: "Failed to save draft" };
    }

    return {
      success: true,
      draft: {
        id: draft.id,
        amountCents: draft.amount_cents,
        frequency: draft.frequency,
        allocations: typeof draft.allocations === "string"
          ? JSON.parse(draft.allocations)
          : draft.allocations,
        updatedAt: draft.updated_at,
      },
    };
  } catch (error) {
    console.error("Save draft error:", error);
    return { success: false, error: "Failed to save draft" };
  }
}

export async function loadDraft(): Promise<DraftResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to load drafts" };
  }

  try {
    const { data: draft, error } = await supabase
      .from("donation_drafts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No draft found - that's okay
        return { success: true, draft: undefined };
      }
      console.error("Failed to load draft:", error);
      return { success: false, error: "Failed to load draft" };
    }

    return {
      success: true,
      draft: {
        id: draft.id,
        amountCents: draft.amount_cents,
        frequency: draft.frequency,
        allocations: typeof draft.allocations === "string"
          ? JSON.parse(draft.allocations)
          : draft.allocations,
        updatedAt: draft.updated_at,
      },
    };
  } catch (error) {
    console.error("Load draft error:", error);
    return { success: false, error: "Failed to load draft" };
  }
}

export async function clearDraft(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to clear drafts" };
  }

  try {
    const { error } = await supabase
      .from("donation_drafts")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to clear draft:", error);
      return { success: false, error: "Failed to clear draft" };
    }

    return { success: true };
  } catch (error) {
    console.error("Clear draft error:", error);
    return { success: false, error: "Failed to clear draft" };
  }
}

export async function createCheckoutSession(
  amountCents: number,
  allocations: AllocationInput[],
  frequency: DonationFrequency = "one-time"
): Promise<CreateCheckoutResult> {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to donate" };
  }

  // Validate amount
  if (amountCents < config.features.minDonationCents) {
    return {
      success: false,
      error: `Minimum donation is $${config.features.minDonationCents / 100}`,
    };
  }

  // Validate allocations
  const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);
  if (totalPercentage !== 100) {
    return { success: false, error: "Allocations must total 100%" };
  }

  if (allocations.length === 0) {
    return { success: false, error: "At least one allocation is required" };
  }

  if (allocations.length > config.features.maxAllocationItems) {
    return {
      success: false,
      error: `Maximum ${config.features.maxAllocationItems} allocations allowed`,
    };
  }

  try {
    // Check if simulation mode is enabled
    const simulationMode = await isSimulationModeEnabled();

    // Use admin client for database operations to bypass RLS
    // This ensures both donation and allocations are created reliably
    const adminClient = createAdminClient();

    // Get user's organization_id if they have one
    const { data: userData } = await adminClient
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const isRecurring = frequency !== "one-time";
    const recurringInterval = isRecurring ? frequency as RecurringInterval : null;

    // Prepare allocation records first to validate nonprofit/category IDs exist
    const allocationRecords = allocations.map((a) => ({
      nonprofit_id: a.type === "nonprofit" ? a.targetId : null,
      category_id: a.type === "category" ? a.targetId : null,
      percentage: a.percentage,
      amount_cents: Math.round((amountCents * a.percentage) / 100),
      disbursed: false,
    }));

    // Create donation record (pending for real payments, completed for simulation)
    const { data: donation, error: donationError } = await adminClient
      .from("donations")
      .insert({
        user_id: user.id,
        organization_id: userData?.organization_id || null,
        amount_cents: amountCents,
        status: simulationMode ? "completed" : "pending",
        is_recurring: isRecurring,
        recurring_interval: recurringInterval,
        is_simulated: simulationMode,
        completed_at: simulationMode ? new Date().toISOString() : null,
        stripe_payment_intent_id: simulationMode ? `sim_${Date.now()}` : null,
        stripe_charge_id: simulationMode ? `sim_ch_${Date.now()}` : null,
      })
      .select()
      .single();

    if (donationError || !donation) {
      console.error("Failed to create donation:", donationError);
      return { success: false, error: "Failed to create donation record" };
    }

    // Add donation_id to allocation records and insert
    const allocationsWithDonationId = allocationRecords.map((a) => ({
      ...a,
      donation_id: donation.id,
    }));

    const { error: allocError } = await adminClient
      .from("allocations")
      .insert(allocationsWithDonationId);

    if (allocError) {
      console.error("Failed to create allocations:", allocError);
      // Clean up the donation
      await adminClient.from("donations").delete().eq("id", donation.id);
      return { success: false, error: "Failed to create allocation records" };
    }

    // If simulation mode is enabled, skip Stripe and go directly to success page
    if (simulationMode) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return { success: true, url: `${baseUrl}/donate/success?donation_id=${donation.id}&simulated=true` };
    }

    // Real payment flow - create Stripe checkout session
    const stripe = getStripeServer();

    // Build line item description
    const allocationSummary = allocations
      .map((a) => `${a.targetName} (${a.percentage}%)`)
      .join(", ");

    // Map frequency to Stripe interval
    const stripeIntervalMap: Record<RecurringInterval, { interval: "month" | "year"; interval_count: number }> = {
      monthly: { interval: "month", interval_count: 1 },
      quarterly: { interval: "month", interval_count: 3 },
      annually: { interval: "year", interval_count: 1 },
    };

    // Create Stripe Checkout Session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (isRecurring && recurringInterval) {
      // Create subscription checkout
      const { interval, interval_count } = stripeIntervalMap[recurringInterval];

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: user.email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Recurring Charitable Donation",
                description: `${frequency} donation - Allocation: ${allocationSummary}`,
              },
              unit_amount: amountCents,
              recurring: {
                interval,
                interval_count,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          donation_id: donation.id,
          user_id: user.id,
          frequency,
          allocations: JSON.stringify(allocations),
        },
        subscription_data: {
          metadata: {
            donation_id: donation.id,
            user_id: user.id,
            frequency,
          },
        },
        success_url: `${baseUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/donate?canceled=true`,
      });

      // Update donation with Stripe session ID
      await supabase
        .from("donations")
        .update({ stripe_payment_intent_id: session.id })
        .eq("id", donation.id);

      return { success: true, url: session.url || undefined };
    } else {
      // Create one-time payment checkout
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: user.email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Charitable Donation",
                description: `Allocation: ${allocationSummary}`,
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          donation_id: donation.id,
          user_id: user.id,
        },
        success_url: `${baseUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/donate?canceled=true`,
      });

      // Update donation with Stripe session ID
      await supabase
        .from("donations")
        .update({ stripe_payment_intent_id: session.id })
        .eq("id", donation.id);

      return { success: true, url: session.url || undefined };
    }
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return { success: false, error: "Failed to create checkout session" };
  }
}
