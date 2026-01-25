import { useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useLegislators } from '@/lib/api/queries';
import { PARTY_COLORS } from '@/lib/constants';
import committeesData from '@/data/committees.json';

interface GraphNode {
  id: string;
  name: string;
  type: 'legislator' | 'committee';
  party?: 'R' | 'D';
  chamber?: string;
  district?: number;
  isChair?: boolean;
  isViceChair?: boolean;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
  role?: 'chair' | 'vice-chair' | 'member';
}

export function CommitteeNetwork() {
  const { data: legislators, isLoading } = useLegislators();
  const containerRef = useRef<HTMLDivElement>(null);

  const graphData = useMemo(() => {
    if (!legislators) {
      return { nodes: [], links: [] };
    }

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const legislatorNodeMap = new Map<string, GraphNode>();

    // Create nodes for all legislators
    legislators.districts.forEach((district) => {
      // Add senator
      const senatorNode: GraphNode = {
        id: district.senator.name,
        name: district.senator.name,
        type: 'legislator',
        party: district.senator.party,
        chamber: 'senate',
        district: district.id,
      };
      nodes.push(senatorNode);
      legislatorNodeMap.set(district.senator.name, senatorNode);

      // Add representatives
      district.representatives.forEach((rep) => {
        const repNode: GraphNode = {
          id: rep.name,
          name: rep.name,
          type: 'legislator',
          party: rep.party,
          chamber: 'house',
          district: district.id,
        };
        nodes.push(repNode);
        legislatorNodeMap.set(rep.name, repNode);
      });
    });

    // Add committee nodes and create links
    [...committeesData.senate, ...committeesData.house].forEach((committee) => {
      nodes.push({
        id: committee.id,
        name: committee.name,
        type: 'committee',
      });

      // Link chair
      if (committee.chair && legislatorNodeMap.has(committee.chair)) {
        links.push({
          source: committee.chair,
          target: committee.id,
          value: 3,
          role: 'chair',
        });
        legislatorNodeMap.get(committee.chair)!.isChair = true;
      }

      // Link vice chair
      if (committee.viceChair && legislatorNodeMap.has(committee.viceChair)) {
        links.push({
          source: committee.viceChair,
          target: committee.id,
          value: 2,
          role: 'vice-chair',
        });
        legislatorNodeMap.get(committee.viceChair)!.isViceChair = true;
      }

      // Link members
      committee.members.forEach((member) => {
        if (legislatorNodeMap.has(member) && member !== committee.chair && member !== committee.viceChair) {
          links.push({
            source: member,
            target: committee.id,
            value: 1,
            role: 'member',
          });
        }
      });
    });

    return { nodes, links };
  }, [legislators]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading committee data...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="px-4 py-6 sm:px-6 lg:px-8 bg-white border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">
          Arizona Legislature Committee Network
        </h1>
        <p className="text-gray-600 mt-2">
          Interactive visualization of committee assignments and legislative connections
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
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-500" />
            <span className="text-sm text-gray-700">Committee</span>
          </div>
        </div>
      </div>
      <div ref={containerRef} className="flex-1">
        <ForceGraph2D
          graphData={graphData}
          nodeLabel={(node) => {
            const n = node as GraphNode;
            if (n.type === 'committee') {
              return n.name;
            }
            return `${n.name} (${n.party}) - District ${n.district} - ${n.chamber}`;
          }}
          nodeColor={(node) => {
            const n = node as GraphNode;
            if (n.type === 'committee') {
              return '#6b7280';
            }
            return n.party ? PARTY_COLORS[n.party] : '#9ca3af';
          }}
          nodeRelSize={8}
          nodeVal={(node) => {
            const n = node as GraphNode;
            return n.type === 'committee' ? 15 : 5;
          }}
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
