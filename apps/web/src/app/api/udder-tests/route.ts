import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("udder_quarter_tests")
      .insert({
        animal_id: body.animal_id,
        test_date: body.test_date,
        test_type: body.test_type,
        lf_scc: body.lf_scc,
        lr_scc: body.lr_scc,
        rf_scc: body.rf_scc,
        rr_scc: body.rr_scc,
        lf_cmt: body.lf_cmt,
        lr_cmt: body.lr_cmt,
        rf_cmt: body.rf_cmt,
        rr_cmt: body.rr_cmt,
        lf_pathogen: body.lf_pathogen,
        lr_pathogen: body.lr_pathogen,
        rf_pathogen: body.rf_pathogen,
        rr_pathogen: body.rr_pathogen,
        notes: body.notes,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating udder test:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in POST /api/udder-tests:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
