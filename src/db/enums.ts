export const ServiceRewardsActorParameterType = {
    MIN_LOT_ALPHA_NUMERATOR: "MIN_LOT_ALPHA_NUMERATOR",
    MIN_LOT_ALPHA_DENOMINATOR: "MIN_LOT_ALPHA_DENOMINATOR",
    MIN_LOT_FLOOR: "MIN_LOT_FLOOR",
    PRICE_BAND_BPS: "PRICE_BAND_BPS",
    REGISTRATION_CUTOFF_EPOCHS: "REGISTRATION_CUTOFF_EPOCHS"
} as const;
export type ServiceRewardsActorParameterType = (typeof ServiceRewardsActorParameterType)[keyof typeof ServiceRewardsActorParameterType];
