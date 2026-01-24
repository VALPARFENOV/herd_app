import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("hoof_inspections")
      .insert({
        animal_id: body.animal_id,
        inspection_date: body.inspection_date,
        locomotion_score: body.locomotion_score,
        trim_type: body.trim_type,
        trimmer_name: body.trimmer_name,
        notes: body.notes,
      })
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
