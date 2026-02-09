import { useMemo, useState } from 'react';
import { useLegislators } from '@/lib/api/queries';
import { PARTY_COLORS, COMMITTEES_URL } from '@/lib/constants';
import committeesData from '@/data/committees.json';
import '@/styles/committees.css';

interface CommitteeWithMembers {
  id: string;
  committeeId: number;
  name: string;
  shortName: string;
  chair: string;
  viceChair?: string;
  members: string[];
  chamber: 'senate' | 'house';
  memberDetails: Array<{
    name: string;
    party: 'R' | 'D';
    role: 'chair' | 'vice-chair' | 'member';
    district: number;
    chamber: string;
  }>;
}

export function CommitteeNetwork() {
  const { data: legislators, isLoading } = useLegislators();
  const [filterChamber, setFilterChamber] = useState<'all' | 'senate' | 'house'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const committeesWithDetails = useMemo(() => {
    if (!legislators) return [];

    const legislatorMap = new Map<string, { party: 'R' | 'D'; district: number; chamber: string }>();

    legislators.districts.forEach((district) => {
      legislatorMap.set(district.senator.name, {
        party: district.senator.party,
        district: district.id,
        chamber: 'Senate',
      });
      district.representatives.forEach((rep) => {
        legislatorMap.set(rep.name, {
          party: rep.party,
          district: district.id,
          chamber: 'House',
        });
      });
    });

    const allCommittees: CommitteeWithMembers[] = [];

    [...committeesData.senate, ...committeesData.house].forEach((committee) => {
      const memberDetails: CommitteeWithMembers['memberDetails'] = [];

      if (committee.chair && legislatorMap.has(committee.chair)) {
        const info = legislatorMap.get(committee.chair)!;
        memberDetails.push({
          name: committee.chair,
          party: info.party,
          role: 'chair',
          district: info.district,
          chamber: info.chamber,
        });
      }

      if (committee.viceChair && legislatorMap.has(committee.viceChair)) {
        const info = legislatorMap.get(committee.viceChair)!;
        memberDetails.push({
          name: committee.viceChair,
          party: info.party,
          role: 'vice-chair',
          district: info.district,
          chamber: info.chamber,
        });
      }

      committee.members.forEach((member) => {
        if (legislatorMap.has(member) && member !== committee.chair && member !== committee.viceChair) {
          const info = legislatorMap.get(member)!;
          memberDetails.push({
            name: member,
            party: info.party,
            role: 'member',
            district: info.district,
            chamber: info.chamber,
          });
        }
      });

      const chamber = committeesData.senate.some(c => c.id === committee.id) ? 'senate' : 'house';

      allCommittees.push({
        ...committee,
        chamber,
        memberDetails: memberDetails.sort((a, b) => {
          if (a.role === 'chair') return -1;
          if (b.role === 'chair') return 1;
          if (a.role === 'vice-chair') return -1;
          if (b.role === 'vice-chair') return 1;
          return a.name.localeCompare(b.name);
        }),
      });
    });

    return allCommittees;
  }, [legislators]);

  const filteredCommittees = useMemo(() => {
    return committeesWithDetails.filter((committee) => {
      const matchesChamber = filterChamber === 'all' || committee.chamber === filterChamber;
      const matchesSearch =
        searchQuery === '' ||
        committee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        committee.memberDetails.some(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesChamber && matchesSearch;
    });
  }, [committeesWithDetails, filterChamber, searchQuery]);

  const partyComposition = (committee: CommitteeWithMembers) => {
    const republicans = committee.memberDetails.filter(m => m.party === 'R').length;
    const democrats = committee.memberDetails.filter(m => m.party === 'D').length;
    return { republicans, democrats };
  };

  if (isLoading) {
    return (
      <div className="committees-loading">
        <div className="loading-spinner"></div>
        <p>Loading committee rosters...</p>
      </div>
    );
  }

  return (
    <div className="committees-container">
      {/* Header */}
      <div className="committees-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="committees-title">
              The Committee Roster
            </h1>
            <p className="committees-subtitle">
              57th Arizona Legislature • 2025 Session
            </p>
          </div>

          <div className="header-meta">
            <div className="meta-stat">
              <span className="meta-number">{committeesWithDetails.length}</span>
              <span className="meta-label">Committees</span>
            </div>
            <div className="meta-divider"></div>
            <div className="meta-stat">
              <span className="meta-number">{committeesWithDetails.filter(c => c.chamber === 'senate').length}</span>
              <span className="meta-label">Senate</span>
            </div>
            <div className="meta-divider"></div>
            <div className="meta-stat">
              <span className="meta-number">{committeesWithDetails.filter(c => c.chamber === 'house').length}</span>
              <span className="meta-label">House</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="committees-filters">
        <div className="filter-group">
          <button
            className={`filter-button ${filterChamber === 'all' ? 'active' : ''}`}
            onClick={() => setFilterChamber('all')}
          >
            All Committees
          </button>
          <button
            className={`filter-button ${filterChamber === 'senate' ? 'active' : ''}`}
            onClick={() => setFilterChamber('senate')}
          >
            Senate
          </button>
          <button
            className={`filter-button ${filterChamber === 'house' ? 'active' : ''}`}
            onClick={() => setFilterChamber('house')}
          >
            House
          </button>
        </div>

        <div className="search-container">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Search committees or members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Filter result count */}
      {(filterChamber !== 'all' || searchQuery) && (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem 0.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--newsprint)', fontWeight: 500 }}>
            Showing {filteredCommittees.length} of {committeesWithDetails.length} committees
          </p>
        </div>
      )}

      {/* Committee Cards Grid */}
      <div className="committees-grid">
        {filteredCommittees.map((committee, index) => {
          const { republicans, democrats } = partyComposition(committee);

          return (
            <div
              key={committee.id}
              className="committee-card"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Committee Seal/Header */}
              <div className="committee-seal">
                <div className="seal-ornament"></div>
                <div className="seal-content">
                  <span className="chamber-badge">{committee.chamber}</span>
                  <h2 className="committee-name">{committee.name}</h2>
                  {committee.shortName && (
                    <span className="committee-short-name">{committee.shortName}</span>
                  )}
                </div>
                <div className="seal-ornament seal-ornament-bottom"></div>
              </div>

              {/* Party Composition Bar */}
              <div className="party-composition">
                <div className="composition-bar">
                  <div
                    className="composition-segment composition-republican"
                    style={{
                      width: `${(republicans / (republicans + democrats)) * 100}%`,
                      backgroundColor: PARTY_COLORS.R
                    }}
                  ></div>
                  <div
                    className="composition-segment composition-democrat"
                    style={{
                      width: `${(democrats / (republicans + democrats)) * 100}%`,
                      backgroundColor: PARTY_COLORS.D
                    }}
                  ></div>
                </div>
                <div className="composition-labels">
                  <span className="composition-label" style={{ color: PARTY_COLORS.R }}>
                    {republicans} R
                  </span>
                  <span className="composition-divider">•</span>
                  <span className="composition-label" style={{ color: PARTY_COLORS.D }}>
                    {democrats} D
                  </span>
                </div>
              </div>

              {/* Members List */}
              <div className="members-list">
                {committee.memberDetails.map((member, idx) => (
                  <div key={`${member.name}-${idx}`} className="member-row">
                    <div className="member-info">
                      <div className="member-name-row">
                        <span className="member-name">{member.name}</span>
                        {member.role !== 'member' && (
                          <span className={`role-badge role-${member.role}`}>
                            {member.role === 'chair' ? 'Chair' : 'Vice Chair'}
                          </span>
                        )}
                      </div>
                      <div className="member-meta">
                        <span className="member-district">District {member.district}</span>
                        <span className="meta-separator">•</span>
                        <span className="member-chamber">{member.chamber}</span>
                      </div>
                    </div>
                    <div
                      className="party-indicator"
                      style={{ backgroundColor: PARTY_COLORS[member.party] }}
                      title={member.party === 'R' ? 'Republican' : 'Democrat'}
                    >
                      {member.party}
                    </div>
                  </div>
                ))}
              </div>

              {/* Committee Link */}
              <a
                href={`${COMMITTEES_URL}#${committee.committeeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="committee-link"
              >
                <span>View Committee Activities</span>
                <svg className="link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17L17 7M17 7H7M17 7V17"></path>
                </svg>
              </a>
            </div>
          );
        })}
      </div>

      {filteredCommittees.length === 0 && (
        <div className="no-results">
          <p>No committees found matching your search.</p>
        </div>
      )}
    </div>
  );
}
