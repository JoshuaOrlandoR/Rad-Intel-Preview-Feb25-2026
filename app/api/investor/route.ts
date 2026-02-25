import { NextResponse } from "next/server"

import {
  createDealInvestor,
  updateDealInvestor,
  getInvestorAccessLink,
  isDealmakerConfigured,
} from "@/lib/dealmaker"

export async function POST(request: Request) {
  if (!isDealmakerConfigured()) {
    return NextResponse.json(
      { error: "DealMaker is not configured. Add API credentials to proceed." },
      { status: 503 }
    )
  }

  const dealId = process.env.DEALMAKER_DEAL_ID!
  const body = await request.json()

  try {
    const investor = await createDealInvestor(dealId, {
      email: body.email,
      first_name: body.firstName,
      last_name: body.lastName,
      investment_value: body.investmentAmount,
      allocation_unit: "amount",
    })

    // Get DealMaker's OTP access link for the investor to complete payment
    let paymentUrl: string | null = null
    try {
      const accessLink = await getInvestorAccessLink(dealId, investor.id)
      paymentUrl = accessLink.access_link || null
    } catch (accessError) {
      console.error("Failed to get investor access link:", accessError)
    }

    return NextResponse.json({
      investorId: investor.id,
      subscriptionId: investor.subscription_id,
      state: investor.state,
      paymentUrl,
    })
  } catch (error) {
    console.error("Failed to create investor:", error)

    const message = error instanceof Error ? error.message.toLowerCase() : ""
    let userMessage = "Something went wrong. Please try again or contact support."

    if (message.includes("422") || message.includes("unprocessable")) {
      if (!body.email || !body.firstName || !body.lastName) {
        userMessage = "Please fill in all required fields (first name, last name, and email)."
      } else {
        userMessage = "The information provided could not be processed. Please check your details and try again."
      }
    } else if (message.includes("409") || message.includes("conflict") || message.includes("already")) {
      userMessage = "An investor with this email already exists for this deal. Please use a different email address."
    } else if (message.includes("401") || message.includes("auth")) {
      userMessage = "Authentication error. Please try again later."
    } else if (message.includes("404")) {
      userMessage = "The investment deal could not be found. Please try again later."
    }

    return NextResponse.json(
      { error: userMessage },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  if (!isDealmakerConfigured()) {
    return NextResponse.json(
      { error: "DealMaker is not configured" },
      { status: 503 }
    )
  }

  const dealId = process.env.DEALMAKER_DEAL_ID!
  const body = await request.json()

  try {
    const updated = await updateDealInvestor(dealId, body.investorId, {
      current_step: body.currentStep,
    })

    return NextResponse.json({
      investorId: updated.id,
      state: updated.state,
      currentStep: updated.current_step,
    })
  } catch (error) {
    console.error("Failed to update investor:", error)
    return NextResponse.json(
      { error: "Failed to update investor record" },
      { status: 500 }
    )
  }
}
