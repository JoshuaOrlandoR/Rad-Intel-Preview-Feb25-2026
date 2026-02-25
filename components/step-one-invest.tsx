"use client"

import { useState, useEffect } from "react"
import { ArrowUpDown } from "lucide-react"
import {
  FALLBACK_CONFIG,
  calculateInvestment,
  getNextTierInfo,
  alignToSharePrice,
  formatCurrency,
  formatNumber,
  type InvestmentConfig,
} from "@/lib/investment-utils"

interface StepOneInvestProps {
  onContinue: (amount: number) => void
  initialAmount?: number
  config?: InvestmentConfig
}

export function StepOneInvest({ onContinue, initialAmount, config = FALLBACK_CONFIG }: StepOneInvestProps) {
  const [amount, setAmount] = useState(initialAmount || config.presetAmounts[0])
  const [inputValue, setInputValue] = useState("")
  const [inputMode, setInputMode] = useState<"dollars" | "shares">("dollars")
  const [customAmount, setCustomAmount] = useState("")

  const calculation = calculateInvestment(amount, config)
  const isAboveMin = amount >= config.minInvestment
  const isBelowMax = !config.maxInvestment || amount <= config.maxInvestment
  const isValidAmount = isAboveMin && isBelowMax
  const nextTier = getNextTierInfo(amount, config)
  
  const showUpsell = nextTier && nextTier.amountNeeded <= 2000 && amount < 25000

  useEffect(() => {
    if (inputMode === "dollars") {
      setInputValue(amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    } else {
      setInputValue(calculation.baseShares.toLocaleString("en-US"))
    }
  }, [amount, inputMode, calculation.baseShares])

  const handleInputChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, "")
    setInputValue(cleanValue)
    const numValue = parseFloat(cleanValue) || 0

    if (inputMode === "dollars") {
      const aligned = numValue > 0 ? alignToSharePrice(numValue, config.sharePrice) : 0
      setAmount(aligned)
    } else {
      // Shares mode: whole shares only
      const wholeShares = Math.round(numValue)
      setAmount(parseFloat((wholeShares * config.sharePrice).toFixed(2)))
    }
  }

  const toggleInputMode = () => {
    setInputMode(inputMode === "dollars" ? "shares" : "dollars")
  }

  const handlePresetClick = (presetAmount: number) => {
    setInputMode("dollars")
    setInputValue(presetAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    setAmount(presetAmount)
    setCustomAmount("")
  }

  const handleCustomAmountChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, "")
    setCustomAmount(cleanValue)
    const numValue = parseFloat(cleanValue) || 0
    // Auto-round to nearest whole share count
    const aligned = numValue > 0 ? alignToSharePrice(numValue, config.sharePrice) : 0
    setAmount(aligned)
    setInputMode("dollars")
  }

  const handleUpsellAccept = () => {
    if (nextTier) {
      setAmount(nextTier.threshold)
      setCustomAmount("")
    }
  }

  const customCalc = customAmount ? calculateInvestment(parseFloat(customAmount) || 0, config) : null

  return (
    <div className="step1-page min-h-screen flex items-center justify-center p-4 pb-24 md:pb-4 bg-[#faf9f7]">
      <div className="step1-container w-full max-w-[460px]">
        {/* Progress Indicator - Mobile */}
        <div className="step1-progress mb-4 md:hidden">
          <div className="step1-progress__header flex items-center justify-between text-xs text-[#888] mb-2">
            <span className="step1-progress__step font-medium text-[#c96b4b]">Step 1 of 2</span>
            <span>Investment Amount</span>
          </div>
          <div className="step1-progress__bar h-1 bg-[#e8e4e0] rounded-full">
            <div className="step1-progress__fill h-full bg-[#c96b4b] rounded-full w-1/2" />
          </div>
        </div>

        {/* Main Card */}
        <div className="step1-card bg-white rounded-xl border-2 border-[#c96b4b] p-6 md:p-8">
          <h1 className="step1-title font-serif text-2xl md:text-[1.625rem] font-bold text-center text-[#1a1a1a] mb-6 md:mb-8 leading-tight">
            How much would you like<br />to invest?
          </h1>

          {/* Input Section */}
          <div className="step1-input-row flex gap-2 mb-1">
            <div className="step1-input-row__field flex-1">
              <input
                type="text"
                value={inputMode === "dollars" ? `$${inputValue}` : inputValue}
                onChange={(e) => {
                  const val = e.target.value.replace(/^\$/, "")
                  handleInputChange(val)
                }}
                className="step1-input w-full px-4 py-3 text-[0.9375rem] border border-[#e0e0e0] rounded-lg bg-white text-[#1a1a1a] focus:outline-none focus:border-[#c96b4b] focus:ring-2 focus:ring-[#c96b4b]/20"
              />
            </div>
            <button
              type="button"
              onClick={toggleInputMode}
              className="step1-input-toggle w-12 h-12 flex items-center justify-center bg-[#c96b4b] text-white rounded-lg hover:bg-[#b85d40] transition-colors"
              aria-label="Toggle between dollars and shares"
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>

          {/* Share Count & Minimum */}
          <div className="step1-shares-info mb-5">
            <p className="step1-shares-info__count text-[#777] text-[0.9375rem]">
              {formatNumber(calculation.baseShares)} Shares of RAD Intel
            </p>
            <p className="step1-shares-info__minimum text-[#999] text-[0.8125rem]">
              Minimum investment {formatCurrency(config.minInvestment, 2)}
              {config.maxInvestment ? ` | Maximum ${formatCurrency(config.maxInvestment, 0)}` : ""}
            </p>
            {!isBelowMax && config.maxInvestment && (
              <p className="text-red-500 text-[0.8125rem] font-medium mt-1">
                Maximum investment is {formatCurrency(config.maxInvestment, 0)}
              </p>
            )}
          </div>

          {/* Upsell Prompt */}
          {showUpsell && nextTier && (
            <div className="step1-upsell bg-[#fff8f5] border border-[#f5ddd5] rounded-lg p-3 mb-4">
              <p className="step1-upsell__text text-[0.8125rem] text-[#994d38] mb-2">
                Add {formatCurrency(nextTier.amountNeeded, 0)} more to unlock{" "}
                <span className="step1-upsell__highlight font-semibold">{nextTier.bonusPercent}% bonus</span>{" "}
                (+{formatNumber(Math.floor((calculation.baseShares + Math.floor(nextTier.amountNeeded / config.sharePrice)) * (nextTier.bonusPercent / 100)))} extra shares)
              </p>
              <button
                type="button"
                onClick={handleUpsellAccept}
                className="step1-upsell__action text-xs font-medium text-[#c96b4b] underline hover:text-[#b85d40]"
              >
                Yes, increase to {formatCurrency(nextTier.threshold, 0)}
              </button>
            </div>
          )}

          {/* Preset Buttons */}
          <div className="step1-presets flex flex-col gap-2.5 mb-5">
            {config.presetAmounts.map((preset) => {
              const presetCalc = calculateInvestment(preset, config)
              const isSelected = Math.abs(amount - preset) < 1
              const hasBonus = presetCalc.bonusPercent > 0

              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`step1-preset w-full py-3 md:py-3.5 px-4 rounded-full text-left transition-colors border-2 ${
                    isSelected 
                      ? "step1-preset--selected bg-[#f9ebe6] border-[#c96b4b]" 
                      : "step1-preset--unselected bg-[#f8f5f2] border-transparent hover:bg-[#f5f0ec]"
                  }`}
                >
                  <div className="step1-preset__content flex items-center justify-between">
                    {/* Left side: Radio + Amount + Shares */}
                    <div className="step1-preset__left flex items-center gap-2.5">
                      <div className={`step1-radio w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "step1-radio--selected border-[#c96b4b]" : "border-[#ccc]"
                      }`}>
                        {isSelected && <div className="step1-radio__dot w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#c96b4b]" />}
                      </div>
                      <div>
                        <div className="step1-preset__amount text-[0.9375rem] md:text-[1.0625rem] font-semibold text-[#1a1a1a]">
                          {formatCurrency(preset, 0)}
                        </div>
                        <div className="step1-preset__shares text-[0.6875rem] md:text-xs text-[#888]">
                          {formatNumber(presetCalc.baseShares)} Shares
                        </div>
                      </div>
                    </div>

                    {/* Right side: Bonus pills */}
                    {hasBonus && (
                      <div className="step1-preset__bonus flex items-center gap-1 md:gap-1.5 flex-shrink-0">
                        <span className="step1-bonus-pill step1-bonus-pill--primary text-[0.625rem] md:text-[0.75rem] font-semibold py-1 px-2 md:py-1.5 md:px-3 rounded-full whitespace-nowrap text-center leading-snug bg-[#c96b4b] text-white">
                          +{formatNumber(presetCalc.bonusShares)}<br />
                          <span className="text-[0.5rem] md:text-[0.625rem] font-medium">Bonus Shares</span>
                        </span>
                        <span className="step1-bonus-pill step1-bonus-pill--secondary text-[0.625rem] md:text-[0.75rem] font-semibold py-1 px-2 md:py-1.5 md:px-3 rounded-full whitespace-nowrap text-center leading-snug bg-[#f5ddd5] text-[#994d38]">
                          {presetCalc.bonusPercent}%<br />
                          <span className="text-[0.5rem] md:text-[0.625rem] font-medium">Bonus</span>
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Custom Amount Input */}
          <div className="step1-custom border-t border-[#e8e8e8] pt-4 mb-4">
            <div className="step1-custom__input-wrapper flex items-center gap-3 bg-[#f8f5f2] rounded-lg py-3 px-4">
              <span className="step1-custom__label text-sm font-medium text-[#1a1a1a]">Amount: $</span>
              <input
                type="text"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="Enter amount"
                className="step1-custom__input flex-1 bg-transparent border-none text-sm text-[#1a1a1a] focus:outline-none placeholder:text-[#aaa]"
              />
            </div>
            {customCalc && parseFloat(customAmount) > 0 && config.maxInvestment && amount > config.maxInvestment && (
              <p className="mt-2 text-xs text-red-500 font-medium">
                Maximum investment is {formatCurrency(config.maxInvestment, 0)}
              </p>
            )}
            {customAmount && parseFloat(customAmount) > 0 && amount > 0 && amount !== parseFloat(customAmount) && (
              <p className="mt-2 text-xs text-[#c96b4b] font-medium">
                Adjusted to {formatCurrency(amount)} for {formatNumber(calculation.baseShares)} whole shares at {formatCurrency(config.sharePrice)}/share
              </p>
            )}
            {customCalc && amount >= config.minInvestment && (!config.maxInvestment || amount <= config.maxInvestment) && (
              <div className="step1-custom__result mt-2 text-xs text-[#666]">
                <span className="font-medium">{formatNumber(calculation.totalShares)} Total Shares</span>
                {calculation.bonusPercent > 0 && (
                  <span className="step1-custom__bonus text-[#c96b4b] ml-1">
                    (+{formatNumber(calculation.bonusShares)} bonus at {calculation.bonusPercent}%)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Total Shares */}
          <div className="step1-total flex items-center justify-between py-2 mb-2">
            <span className="step1-total__label text-sm text-[#666]">Total Shares</span>
            <span className="step1-total__value text-xl font-semibold text-[#1a1a1a]">{formatNumber(calculation.totalShares)}</span>
          </div>

          {/* Disclaimer */}
          <p className="step1-disclaimer text-[0.6875rem] text-[#999] mb-4 leading-relaxed">
            All shares assume conversion of convertible notes into stock at ~{formatCurrency(config.sharePrice, 2)}/share. Final share price will be based on a number of factors.
          </p>

          {/* Continue Button - Hidden on mobile, shown in sticky bar */}
          <button
            type="button"
            onClick={() => onContinue(amount)}
            disabled={!isValidAmount}
            className="step1-continue step1-continue--desktop hidden md:block w-full py-3 rounded-lg text-[0.9375rem] font-medium bg-[#c96b4b] text-white hover:bg-[#b85d40] disabled:bg-[#ccc] disabled:cursor-not-allowed transition-colors"
          >
            Continue
          </button>
        </div>
      </div>

      {/* Sticky Mobile Summary Bar */}
      <div className="step1-mobile-bar fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8e4e0] p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] z-50 md:hidden">
        <div className="step1-mobile-bar__summary flex items-center justify-between mb-2">
          <div className="step1-mobile-bar__text text-xs text-[#666]">
            {calculation.bonusPercent > 0 ? (
              <span>
                Investing {formatCurrency(amount, 2)} → {calculation.bonusPercent}% bonus → {formatNumber(calculation.bonusShares)} bonus shares
              </span>
            ) : (
              <span>
                Investing {formatCurrency(amount, 2)} → {formatNumber(calculation.totalShares)} shares
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onContinue(amount)}
          disabled={!isValidAmount}
          className="step1-mobile-bar__btn w-full py-3 rounded-lg text-sm font-medium bg-[#c96b4b] text-white hover:bg-[#b85d40] disabled:bg-[#ccc] disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
