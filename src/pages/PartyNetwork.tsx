import { useMemo, useState } from 'react';
import { useLegislators } from '@/lib/api/queries';
import { PARTY_COLORS } from '@/lib/constants';
import '@/styles/party-network.css';

interface DistrictData {
  id: number;
  name: string;
  majorCities: string[];
  senator: {
    name: string;
    party: 'R' | 'D';
  };
  representatives: Array<{
    name: string;
    party: 'R' | 'D';
  }>;
  partyComposition: {
    R: number;
    D: number;
  };
}

type SortOption = 'district' | 'party' | 'composition';
type FilterOption = 'all' | 'R' | 'D' | 'mixed' | 'unified';

export function PartyNetwork() {
  const { data: legislators, isLoading } = useLegislators();
  const [sortBy, setSortBy] = useState<SortOption>('district');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const districtData = useMemo(() => {
    if (!legislators) return [];

    return legislators.districts.map((district): DistrictData => {
      const reps = district.representatives;
      const parties = [district.senator.party, ...reps.map(r => r.party)];
      const rCount = parties.filter(p => p === 'R').length;
      const dCount = parties.filter(p => p === 'D').length;

      return {
        id: district.id,
        name: district.name,
        majorCities: district.majorCities,
        senator: {
          name: district.senator.name,
          party: district.senator.party,
        },
        representatives: reps.map(rep => ({
          name: rep.name,
          party: rep.party,
        })),
        partyComposition: {
          R: rCount,
          D: dCount,
        },
      };
    });
  }, [legislators]);

  const filteredAndSorted = useMemo(() => {
    let filtered = districtData.filter((district) => {
      // Filter logic
      if (filterBy === 'R') {
        return district.partyComposition.R > district.partyComposition.D;
      }
      if (filterBy === 'D') {
        return district.partyComposition.D > district.partyComposition.R;
      }
      if (filterBy === 'mixed') {
        return district.partyComposition.R > 0 && district.partyComposition.D > 0;
      }
      if (filterBy === 'unified') {
        return district.partyComposition.R === 0 || district.partyComposition.D === 0;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          district.name.toLowerCase().includes(query) ||
          district.senator.name.toLowerCase().includes(query) ||
          district.representatives.some(r => r.name.toLowerCase().includes(query)) ||
          district.majorCities.some(c => c.toLowerCase().includes(query))
        );
      }

      return true;
    });

    // Sort logic
    if (sortBy === 'party') {
      filtered = [...filtered].sort((a, b) => {
        const aDiff = a.partyComposition.R - a.partyComposition.D;
        const bDiff = b.partyComposition.R - b.partyComposition.D;
        return bDiff - aDiff; // R-heavy first
      });
    } else if (sortBy === 'composition') {
      filtered = [...filtered].sort((a, b) => {
        const aMixed = Math.min(a.partyComposition.R, a.partyComposition.D);
        const bMixed = Math.min(b.partyComposition.R, b.partyComposition.D);
        return bMixed - aMixed; // Most mixed first
      });
    }
    // Default 'district' keeps original order

    return filtered;
  }, [districtData, sortBy, filterBy, searchQuery]);

  const stats = useMemo(() => {
    const totalR = districtData.reduce((sum, d) => sum + d.partyComposition.R, 0);
    const totalD = districtData.reduce((sum, d) => sum + d.partyComposition.D, 0);
    const mixedDistricts = districtData.filter(
      d => d.partyComposition.R > 0 && d.partyComposition.D > 0
    ).length;
    const rControlled = districtData.filter(
      d => d.partyComposition.R > d.partyComposition.D
    ).length;
    const dControlled = districtData.filter(
      d => d.partyComposition.D > d.partyComposition.R
    ).length;

    return { totalR, totalD, mixedDistricts, rControlled, dControlled };
  }, [districtData]);

  if (isLoading) {
    return (
      <div className="party-network-loading">
        <div className="loading-spinner"></div>
        <p>Loading legislative roster...</p>
      </div>
    );
  }

  return (
    <div className="party-network-container">
      {/* Header */}
      <div className="party-network-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="party-network-title">Legislative Directory</h1>
            <p className="party-network-subtitle">
              Party Composition by District • 57th Legislature
            </p>
          </div>

          <div className="header-stats">
            <div className="stat-card stat-republican">
              <div className="stat-value">{stats.totalR}</div>
              <div className="stat-label">Republicans</div>
              <div className="stat-detail">{stats.rControlled} districts</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-card stat-democrat">
              <div className="stat-value">{stats.totalD}</div>
              <div className="stat-label">Democrats</div>
              <div className="stat-detail">{stats.dControlled} districts</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-card stat-mixed">
              <div className="stat-value">{stats.mixedDistricts}</div>
              <div className="stat-label">Mixed</div>
              <div className="stat-detail">Districts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="party-network-controls">
        <div className="controls-section">
          <label className="control-label">Sort By</label>
          <div className="button-group">
            <button
              className={`control-button ${sortBy === 'district' ? 'active' : ''}`}
              onClick={() => setSortBy('district')}
            >
              District #
            </button>
            <button
              className={`control-button ${sortBy === 'party' ? 'active' : ''}`}
              onClick={() => setSortBy('party')}
            >
              Party Lean
            </button>
            <button
              className={`control-button ${sortBy === 'composition' ? 'active' : ''}`}
              onClick={() => setSortBy('composition')}
            >
              Mixed First
            </button>
          </div>
        </div>

        <div className="controls-section">
          <label className="control-label">Filter</label>
          <div className="button-group">
            <button
              className={`control-button ${filterBy === 'all' ? 'active' : ''}`}
              onClick={() => setFilterBy('all')}
            >
              All
            </button>
            <button
              className={`control-button ${filterBy === 'R' ? 'active' : ''}`}
              onClick={() => setFilterBy('R')}
            >
              R-Majority
            </button>
            <button
              className={`control-button ${filterBy === 'D' ? 'active' : ''}`}
              onClick={() => setFilterBy('D')}
            >
              D-Majority
            </button>
            <button
              className={`control-button ${filterBy === 'mixed' ? 'active' : ''}`}
              onClick={() => setFilterBy('mixed')}
            >
              Mixed
            </button>
            <button
              className={`control-button ${filterBy === 'unified' ? 'active' : ''}`}
              onClick={() => setFilterBy('unified')}
            >
              Unified
            </button>
          </div>
        </div>

        <div className="search-section">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Search districts, legislators, or cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* District Cards */}
      <div className="districts-grid">
        {filteredAndSorted.map((district, index) => {
          const isRMajority = district.partyComposition.R > district.partyComposition.D;
          const isDMajority = district.partyComposition.D > district.partyComposition.R;
          const isMixed = district.partyComposition.R > 0 && district.partyComposition.D > 0;

          return (
            <div
              key={district.id}
              className={`district-card ${isRMajority ? 'r-majority' : isDMajority ? 'd-majority' : ''}`}
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              {/* District Header */}
              <div className="district-header">
                <div className="district-number">
                  <span className="number-label">District</span>
                  <span className="number-value">{district.id}</span>
                </div>
                <div className="district-info">
                  <h3 className="district-name">{district.name}</h3>
                  <p className="district-cities">{district.majorCities.join(' • ')}</p>
                </div>
              </div>

              {/* Party Breakdown */}
              <div className="party-breakdown">
                <div className="breakdown-bar">
                  <div
                    className="breakdown-segment breakdown-r"
                    style={{
                      width: `${(district.partyComposition.R / 3) * 100}%`,
                      backgroundColor: PARTY_COLORS.R
                    }}
                  ></div>
                  <div
                    className="breakdown-segment breakdown-d"
                    style={{
                      width: `${(district.partyComposition.D / 3) * 100}%`,
                      backgroundColor: PARTY_COLORS.D
                    }}
                  ></div>
                </div>
                <div className="breakdown-labels">
                  <span className="breakdown-count" style={{ color: PARTY_COLORS.R }}>
                    {district.partyComposition.R}R
                  </span>
                  <span className="breakdown-divider">—</span>
                  <span className="breakdown-count" style={{ color: PARTY_COLORS.D }}>
                    {district.partyComposition.D}D
                  </span>
                  {isMixed && <span className="mixed-badge">Mixed</span>}
                </div>
              </div>

              {/* Legislators */}
              <div className="legislators-list">
                {/* Senator */}
                <div className="legislator-row legislator-senator">
                  <div className="legislator-info">
                    <div className="legislator-name">{district.senator.name}</div>
                    <div className="legislator-role">Senator</div>
                  </div>
                  <div
                    className="party-badge"
                    style={{ backgroundColor: PARTY_COLORS[district.senator.party] }}
                  >
                    {district.senator.party}
                  </div>
                </div>

                {/* Representatives */}
                {district.representatives.map((rep, idx) => (
                  <div key={idx} className="legislator-row legislator-representative">
                    <div className="legislator-info">
                      <div className="legislator-name">{rep.name}</div>
                      <div className="legislator-role">Representative</div>
                    </div>
                    <div
                      className="party-badge"
                      style={{ backgroundColor: PARTY_COLORS[rep.party] }}
                    >
                      {rep.party}
                    </div>
                  </div>
                ))}
              </div>

              {/* District Link */}
              <a href={`/az_leg/district/${district.id}`} className="district-link">
                <span>View District Details</span>
                <svg className="link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"></path>
                </svg>
              </a>
            </div>
          );
        })}
      </div>

      {filteredAndSorted.length === 0 && (
        <div className="no-results">
          <p>No districts found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
