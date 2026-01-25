import { useQuery } from '@tanstack/react-query';
import { fetchDistrictBoundaries, fetchSingleDistrict } from './arcgis';
import { fetchFederalDistrictBoundaries, fetchSingleFederalDistrict } from './federal';
import type { District, DistrictGeoJSON } from '@/types/district';
import type { LegislatureData } from '@/types/legislature';
import type { FederalMapping, CongressMember } from '@/types/federal';
import legislatorsData from '@/data/legislators.json';
import federalMappingData from '@/data/federal-mapping.json';

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
