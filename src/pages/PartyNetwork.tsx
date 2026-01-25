import { useEffect, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useLegislators } from '@/lib/api/queries';
import { PARTY_COLORS } from '@/lib/constants';
import type { Legislator } from '@/types/legislature';

interface GraphNode {
  id: string;
  name: string;
  party: 'R' | 'D';
  chamber: string;
  district: number;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
}

export function PartyNetwork() {
  const { data: legislators, isLoading } = useLegislators();
  const containerRef = useRef<HTMLDivElement>(null);

  const graphData = useMemo(() => {
    if (!legislators) {
      return { nodes: [], links: [] };
    }

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Create nodes for all legislators
    legislators.districts.forEach((district) => {
      // Add senator
      nodes.push({
        id: `${district.senator.name}-${district.id}`,
        name: district.senator.name,
        party: district.senator.party,
        chamber: 'senate',
        district: district.id,
      });

      // Add representatives
      district.representatives.forEach((rep, idx) => {
        nodes.push({
          id: `${rep.name}-${district.id}-${idx}`,
          name: rep.name,
          party: rep.party,
          chamber: 'house',
          district: district.id,
        });
      });
    });

    // Create links between legislators in the same district
    legislators.districts.forEach((district) => {
      const senatorId = `${district.senator.name}-${district.id}`;
      district.representatives.forEach((rep, idx) => {
        const repId = `${rep.name}-${district.id}-${idx}`;
        links.push({
          source: senatorId,
          target: repId,
          value: 1,
        });
      });

      // Link between representatives in same district
      if (district.representatives.length === 2) {
        links.push({
          source: `${district.representatives[0].name}-${district.id}-0`,
          target: `${district.representatives[1].name}-${district.id}-1`,
          value: 1,
        });
      }
    });

    // Create links between legislators of the same party in adjacent districts
    legislators.districts.forEach((district) => {
      const adjacentDistricts = legislators.districts.filter(
        (d) => Math.abs(d.id - district.id) === 1
      );

      adjacentDistricts.forEach((adjDistrict) => {
        // Link senators of same party
        if (district.senator.party === adjDistrict.senator.party) {
          links.push({
            source: `${district.senator.name}-${district.id}`,
            target: `${adjDistrict.senator.name}-${adjDistrict.id}`,
            value: 0.5,
          });
        }
      });
    });

    return { nodes, links };
  }, [legislators]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading network data...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="px-4 py-6 sm:px-6 lg:px-8 bg-white border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">
          Arizona Legislature Party Network
        </h1>
        <p className="text-gray-600 mt-2">
          Interactive visualization of legislative connections by party and district
        </p>
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: PARTY_COLORS.R }} />
            <span className="text-sm text-gray-700">Republican</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: PARTY_COLORS.D }} />
            <span className="text-sm text-gray-700">Democrat</span>
          </div>
        </div>
      </div>
      <div ref={containerRef} className="flex-1">
        <ForceGraph2D
          graphData={graphData}
          nodeLabel={(node) => {
            const n = node as GraphNode;
            return `${n.name} (${n.party}) - District ${n.district} - ${n.chamber}`;
          }}
          nodeColor={(node) => {
            const n = node as GraphNode;
            return PARTY_COLORS[n.party];
          }}
          nodeRelSize={6}
          linkWidth={(link) => (link as GraphLink).value}
          linkColor={() => '#d1d5db'}
          linkDirectionalParticles={0}
          width={containerRef.current?.clientWidth}
          height={containerRef.current?.clientHeight}
        />
      </div>
    </div>
  );
}
