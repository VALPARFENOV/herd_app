import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("milk_readings")
      .insert({
        time: body.time,
        animal_id: body.animal_id,
        session_id: body.session_id,
        milk_kg: body.milk_kg,
        duration_seconds: body.duration_seconds,
        avg_flow_rate: body.avg_flow_rate,
        source: body.source || "manual",
      })
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
