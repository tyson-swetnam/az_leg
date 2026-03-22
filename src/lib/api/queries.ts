import { useQuery } from '@tanstack/react-query';
import { fetchDistrictBoundaries, fetchSingleDistrict } from './arcgis';
import { fetchFederalDistrictBoundaries, fetchSingleFederalDistrict } from './federal';
import { fetchCampaignFinanceId } from './followthemoney';
import { fetchLocalDistricts } from './local-districts';
import type { District, DistrictGeoJSON } from '@/types/district';
import type { LegislatureData, Chamber } from '@/types/legislature';
import type { FederalMapping, CongressMember } from '@/types/federal';
import type { CampaignFinanceData } from '@/types/campaign-finance';
import type { LocalLayerType, LocalDistrictGeoJSON } from '@/types/local-district';
import legislatorsData from '@/data/legislators.json';
import federalMappingData from '@/data/federal-mapping.json';
import { DEFAULT_CAMPAIGN_FINANCE_YEAR } from '@/lib/constants';

const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_WEEK = 7 * ONE_DAY;

/**
 * Fetch all district boundaries from ArcGIS
 * Cached for 24 hours, retained for 7 days
 */
export function useDistrictBoundaries() {
  return useQuery<DistrictGeoJSON>({
    queryKey: ['district-boundaries'],
    queryFn: fetchDistrictBoundaries,
    staleTime: ONE_DAY,
    gcTime: ONE_WEEK,
    retry: 3,
  });
}

/**
 * Fetch a single district boundary by ID
 * Cached for 24 hours, retained for 7 days
 */
export function useSingleDistrictBoundary(districtId: number) {
  return useQuery<DistrictGeoJSON>({
    queryKey: ['district-boundary', districtId],
    queryFn: () => fetchSingleDistrict(districtId),
    staleTime: ONE_DAY,
    gcTime: ONE_WEEK,
    retry: 3,
    enabled: !!districtId,
  });
}

/**
 * Get legislature data from local JSON
 * Never becomes stale since it's local data
 */
export function useLegislators() {
  return useQuery<LegislatureData>({
    queryKey: ['legislators'],
    queryFn: async () => legislatorsData as LegislatureData,
    staleTime: Infinity,
  });
}

/**
 * Get a single district's legislature data
 */
export function useDistrict(districtId: number) {
  return useQuery<District | undefined>({
    queryKey: ['district', districtId],
    queryFn: async () => {
      const data = legislatorsData as LegislatureData;
      return data.districts.find((d) => d.id === districtId);
    },
    staleTime: Infinity,
    enabled: !!districtId,
  });
}

/**
 * Fetch all federal congressional district boundaries from ArcGIS
 * Cached for 24 hours, retained for 7 days
 */
export function useFederalBoundaries() {
  return useQuery<DistrictGeoJSON>({
    queryKey: ['federal-boundaries'],
    queryFn: fetchFederalDistrictBoundaries,
    staleTime: ONE_DAY,
    gcTime: ONE_WEEK,
    retry: 3,
  });
}

/**
 * Fetch a single federal congressional district boundary by ID
 * Cached for 24 hours, retained for 7 days
 */
export function useSingleFederalBoundary(districtId: number) {
  return useQuery<DistrictGeoJSON>({
    queryKey: ['federal-boundary', districtId],
    queryFn: () => fetchSingleFederalDistrict(districtId),
    staleTime: ONE_DAY,
    gcTime: ONE_WEEK,
    retry: 3,
    enabled: !!districtId && districtId >= 1 && districtId <= 9,
  });
}

/**
 * Get federal mapping data from local JSON
 * Maps state legislative districts to federal congressional districts
 * Never becomes stale since it's local data
 */
export function useFederalMapping() {
  return useQuery<FederalMapping>({
    queryKey: ['federal-mapping'],
    queryFn: async () => federalMappingData as FederalMapping,
    staleTime: Infinity,
  });
}

/**
 * Get a single congress member by federal district ID
 */
export function useCongressMember(federalDistrictId: number) {
  return useQuery<CongressMember | undefined>({
    queryKey: ['congress-member', federalDistrictId],
    queryFn: async () => {
      const mapping = federalMappingData as FederalMapping;
      return mapping.congressMembers.find((m) => m.district === federalDistrictId);
    },
    staleTime: Infinity,
    enabled: !!federalDistrictId,
  });
}

/**
 * Get campaign finance data from static mapping
 * Never becomes stale since it's local data
 */
export function useCampaignFinance(
  name: string,
  chamber: Chamber,
  year: number = DEFAULT_CAMPAIGN_FINANCE_YEAR
) {
  return useQuery<CampaignFinanceData | null>({
    queryKey: ['campaign-finance', name, chamber],
    queryFn: () => fetchCampaignFinanceId({ name, chamber, year }),
    staleTime: Infinity,
    enabled: !!name && !!chamber,
  });
}

/**
 * Fetch local district boundaries (counties, supervisors, wards, precincts)
 * Cached for 24 hours, retained for 7 days
 */
export function useLocalDistricts(layerType: LocalLayerType | null) {
  return useQuery<LocalDistrictGeoJSON>({
    queryKey: ['local-districts', layerType],
    queryFn: () => fetchLocalDistricts(layerType!),
    staleTime: ONE_DAY,
    gcTime: ONE_WEEK,
    retry: 3,
    enabled: !!layerType,
  });
}
