import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Get tenant_id from user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("hoof_inspections")
      .insert({
        tenant_id: user.user_metadata.tenant_id,
        animal_id: body.animal_id,
        inspection_date: body.inspection_date,
        locomotion_score: body.locomotion_score || body.score,
        inspector_name: body.inspector_name || body.trimmer_name || body.inspector_id,
        overall_notes: body.overall_notes || body.notes,
        has_lesions: body.has_lesions || false,
        needs_followup: body.needs_followup || false,
        followup_date: body.followup_date || null,
      } as any)
      .select()
      .single()

    if (error) {
      console.error("Error creating hoof inspection:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in POST /api/hoof-inspections:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
