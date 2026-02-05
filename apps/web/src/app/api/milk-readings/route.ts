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
      .from("milk_readings")
      .insert({
        tenant_id: user.user_metadata.tenant_id,
        animal_id: body.animal_id,
        time: body.time || body.reading_date,
        session_id: body.session_id || body.session || "morning",
        milk_kg: body.milk_kg || body.volume_kg,
        duration_seconds: body.duration_seconds || null,
        avg_flow_rate: body.avg_flow_rate || body.flow_rate || null,
        conductivity: body.conductivity || null,
        source: body.source || "manual",
      } as any)
      .select()
      .single()

    if (error) {
      console.error("Error creating milk reading:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in POST /api/milk-readings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
