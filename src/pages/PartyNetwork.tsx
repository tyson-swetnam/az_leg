import { useMemo, useState } from 'react';
import { useLegislators, useLocalOfficials } from '@/lib/api/queries';
import { PARTY_COLORS } from '@/lib/constants';
import type { LocalOfficial, CountyData, CityData } from '@/types/local-official';
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

interface CountyCardData {
  id: string;
  name: string;
  supervisors: LocalOfficial[];
  partyComposition: { R: number; D: number; NP: number };
}

interface CityCardData {
  id: string;
  name: string;
  mayor?: LocalOfficial;
  members: LocalOfficial[];
  governingBody: string;
  partyComposition: { R: number; D: number; NP: number };
}

type Scope = 'state' | 'county' | 'city' | 'all';
type SortOption = 'district' | 'party' | 'composition' | 'alpha' | 'size' | 'partyLean';
type FilterOption = 'all' | 'R' | 'D' | 'mixed' | 'unified';

const NP_COLOR = '#9ca3af';

function getParty(official: LocalOfficial): 'R' | 'D' | null {
  if (official.party === 'R') return 'R';
  if (official.party === 'D') return 'D';
  return null;
}

function countParties(officials: LocalOfficial[]): { R: number; D: number; NP: number } {
  let R = 0, D = 0, NP = 0;
  for (const o of officials) {
    const p = getParty(o);
    if (p === 'R') R++;
    else if (p === 'D') D++;
    else NP++;
  }
  return { R, D, NP };
}

export function PartyNetwork() {
  const { data: legislators, isLoading: legLoading } = useLegislators();
  const { data: localData, isLoading: localLoading } = useLocalOfficials();
  const [scope, setScope] = useState<Scope>('state');
  const [sortBy, setSortBy] = useState<SortOption>('district');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reset sort when scope changes
  const handleScopeChange = (newScope: Scope) => {
    setScope(newScope);
    setFilterBy('all');
    setSearchQuery('');
    if (newScope === 'state') {
      if (!['district', 'party', 'composition'].includes(sortBy)) setSortBy('district');
    } else if (newScope === 'county' || newScope === 'city') {
      if (!['alpha', 'size', 'partyLean'].includes(sortBy)) setSortBy('alpha');
    } else {
      setSortBy('alpha');
    }
  };

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
        senator: { name: district.senator.name, party: district.senator.party },
        representatives: reps.map(rep => ({ name: rep.name, party: rep.party })),
        partyComposition: { R: rCount, D: dCount },
      };
    });
  }, [legislators]);

  const countyData = useMemo((): CountyCardData[] => {
    if (!localData?.counties) return [];
    return Object.entries(localData.counties).map(([id, county]: [string, CountyData]) => ({
      id,
      name: county.name,
      supervisors: county.supervisors,
      partyComposition: countParties(county.supervisors),
    }));
  }, [localData]);

  const cityData = useMemo((): CityCardData[] => {
    if (!localData?.cities) return [];
    return Object.entries(localData.cities).map(([id, city]: [string, CityData]) => {
      const allOfficials = [...(city.mayor ? [city.mayor] : []), ...city.members];
      return {
        id,
        name: city.name,
        mayor: city.mayor,
        members: city.members,
        governingBody: city.governingBody || 'City Council',
        partyComposition: countParties(allOfficials),
      };
    });
  }, [localData]);

  // Filtered + sorted state districts
  const filteredDistricts = useMemo(() => {
    let filtered = districtData.filter((district) => {
      if (filterBy === 'R') return district.partyComposition.R > district.partyComposition.D;
      if (filterBy === 'D') return district.partyComposition.D > district.partyComposition.R;
      if (filterBy === 'mixed') return district.partyComposition.R > 0 && district.partyComposition.D > 0;
      if (filterBy === 'unified') return district.partyComposition.R === 0 || district.partyComposition.D === 0;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          district.name.toLowerCase().includes(query) ||
          district.senator.name.toLowerCase().includes(query) ||
          district.representatives.some(r => r.name.toLowerCase().includes(query)) ||
          district.majorCities.some(c => c.toLowerCase().includes(query)) ||
          `district ${district.id}`.includes(query)
        );
      }
      return true;
    });

    if (sortBy === 'party') {
      filtered = [...filtered].sort((a, b) => (b.partyComposition.R - b.partyComposition.D) - (a.partyComposition.R - a.partyComposition.D));
    } else if (sortBy === 'composition') {
      filtered = [...filtered].sort((a, b) => Math.min(b.partyComposition.R, b.partyComposition.D) - Math.min(a.partyComposition.R, a.partyComposition.D));
    } else if (sortBy === 'alpha') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
    return filtered;
  }, [districtData, sortBy, filterBy, searchQuery]);

  // Filtered + sorted counties
  const filteredCounties = useMemo(() => {
    let filtered = countyData;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.supervisors.some(s => s.name.toLowerCase().includes(query))
      );
    }
    if (sortBy === 'size') {
      filtered = [...filtered].sort((a, b) => b.supervisors.length - a.supervisors.length);
    } else if (sortBy === 'partyLean') {
      filtered = [...filtered].sort((a, b) => {
        const aLean = a.partyComposition.R - a.partyComposition.D;
        const bLean = b.partyComposition.R - b.partyComposition.D;
        return bLean - aLean;
      });
    } else {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
    return filtered;
  }, [countyData, sortBy, searchQuery]);

  // Filtered + sorted cities
  const filteredCities = useMemo(() => {
    let filtered = cityData;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        (c.mayor && c.mayor.name.toLowerCase().includes(query)) ||
        c.members.some(m => m.name.toLowerCase().includes(query))
      );
    }
    if (sortBy === 'size') {
      filtered = [...filtered].sort((a, b) => (b.members.length + (b.mayor ? 1 : 0)) - (a.members.length + (a.mayor ? 1 : 0)));
    } else if (sortBy === 'partyLean') {
      filtered = [...filtered].sort((a, b) => {
        const aLean = a.partyComposition.R - a.partyComposition.D;
        const bLean = b.partyComposition.R - b.partyComposition.D;
        return bLean - aLean;
      });
    } else {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
    return filtered;
  }, [cityData, sortBy, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    // State
    const totalR = districtData.reduce((sum, d) => sum + d.partyComposition.R, 0);
    const totalD = districtData.reduce((sum, d) => sum + d.partyComposition.D, 0);
    const mixedDistricts = districtData.filter(d => d.partyComposition.R > 0 && d.partyComposition.D > 0).length;
    const rControlled = districtData.filter(d => d.partyComposition.R > d.partyComposition.D).length;
    const dControlled = districtData.filter(d => d.partyComposition.D > d.partyComposition.R).length;

    // County
    const countySups = countyData.reduce((sum, c) => sum + c.supervisors.length, 0);
    const countyR = countyData.reduce((sum, c) => sum + c.partyComposition.R, 0);
    const countyD = countyData.reduce((sum, c) => sum + c.partyComposition.D, 0);
    const countyNP = countyData.reduce((sum, c) => sum + c.partyComposition.NP, 0);
    const countyWithParty = countyData.filter(c => c.partyComposition.R > 0 || c.partyComposition.D > 0).length;

    // City
    const cityMembers = cityData.reduce((sum, c) => sum + c.members.length + (c.mayor ? 1 : 0), 0);
    const cityR = cityData.reduce((sum, c) => sum + c.partyComposition.R, 0);
    const cityD = cityData.reduce((sum, c) => sum + c.partyComposition.D, 0);
    const cityNP = cityData.reduce((sum, c) => sum + c.partyComposition.NP, 0);

    return {
      totalR, totalD, mixedDistricts, rControlled, dControlled,
      countySups, countyR, countyD, countyNP, countyWithParty, countyCount: countyData.length,
      cityMembers, cityR, cityD, cityNP, cityCount: cityData.length,
    };
  }, [districtData, countyData, cityData]);

  const isLoading = legLoading || (scope !== 'state' && localLoading);

  if (isLoading) {
    return (
      <div className="party-network-loading">
        <div className="loading-spinner"></div>
        <p>Loading directory...</p>
      </div>
    );
  }

  const showState = scope === 'state' || scope === 'all';
  const showCounty = scope === 'county' || scope === 'all';
  const showCity = scope === 'city' || scope === 'all';
  const isLocalScope = scope === 'county' || scope === 'city' || scope === 'all';

  return (
    <div className="party-network-container">
      {/* Header */}
      <div className="party-network-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="party-network-title">Legislative Directory</h1>
            <p className="party-network-subtitle">
              {scope === 'state' && 'Party Composition by District • 57th Legislature'}
              {scope === 'county' && `County Government • ${stats.countyCount} Counties`}
              {scope === 'city' && `City Government • ${stats.cityCount} Cities`}
              {scope === 'all' && 'All Levels of Government • Arizona'}
            </p>
          </div>

          <div className="header-stats">
            {scope === 'state' && (
              <>
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
              </>
            )}
            {scope === 'county' && (
              <>
                <div className="stat-card">
                  <div className="stat-value">{stats.countySups}</div>
                  <div className="stat-label">Supervisors</div>
                  <div className="stat-detail">{stats.countyCount} counties</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-card stat-republican">
                  <div className="stat-value">{stats.countyR}</div>
                  <div className="stat-label">Republican</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-card stat-democrat">
                  <div className="stat-value">{stats.countyD}</div>
                  <div className="stat-label">Democrat</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-card stat-nonpartisan">
                  <div className="stat-value">{stats.countyNP}</div>
                  <div className="stat-label">Nonpartisan</div>
                  <div className="stat-detail">{stats.countyWithParty} w/ party data</div>
                </div>
              </>
            )}
            {scope === 'city' && (
              <>
                <div className="stat-card">
                  <div className="stat-value">{stats.cityMembers}</div>
                  <div className="stat-label">Officials</div>
                  <div className="stat-detail">{stats.cityCount} cities</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-card stat-republican">
                  <div className="stat-value">{stats.cityR}</div>
                  <div className="stat-label">Republican</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-card stat-democrat">
                  <div className="stat-value">{stats.cityD}</div>
                  <div className="stat-label">Democrat</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-card stat-nonpartisan">
                  <div className="stat-value">{stats.cityNP}</div>
                  <div className="stat-label">Nonpartisan</div>
                </div>
              </>
            )}
            {scope === 'all' && (
              <>
                <div className="stat-card">
                  <div className="stat-value">{stats.totalR + stats.totalD + stats.countySups + stats.cityMembers}</div>
                  <div className="stat-label">All Officials</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-card stat-republican">
                  <div className="stat-value">{stats.totalR + stats.countyR + stats.cityR}</div>
                  <div className="stat-label">Republican</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-card stat-democrat">
                  <div className="stat-value">{stats.totalD + stats.countyD + stats.cityD}</div>
                  <div className="stat-label">Democrat</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-card stat-nonpartisan">
                  <div className="stat-value">{stats.countyNP + stats.cityNP}</div>
                  <div className="stat-label">Nonpartisan</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scope Toggle */}
      <div className="party-network-controls">
        <div className="controls-section">
          <label className="control-label">Scope</label>
          <div className="button-group">
            <button className={`control-button ${scope === 'state' ? 'active' : ''}`} onClick={() => handleScopeChange('state')}>State Legislature</button>
            <button className={`control-button ${scope === 'county' ? 'active' : ''}`} onClick={() => handleScopeChange('county')}>County Government</button>
            <button className={`control-button ${scope === 'city' ? 'active' : ''}`} onClick={() => handleScopeChange('city')}>City Government</button>
            <button className={`control-button ${scope === 'all' ? 'active' : ''}`} onClick={() => handleScopeChange('all')}>All Levels</button>
          </div>
        </div>

        <div className="controls-section">
          <label className="control-label">Sort By</label>
          <div className="button-group">
            {!isLocalScope && (
              <>
                <button className={`control-button ${sortBy === 'district' ? 'active' : ''}`} onClick={() => setSortBy('district')}>District #</button>
                <button className={`control-button ${sortBy === 'party' ? 'active' : ''}`} onClick={() => setSortBy('party')}>Party Lean</button>
                <button className={`control-button ${sortBy === 'composition' ? 'active' : ''}`} onClick={() => setSortBy('composition')}>Mixed First</button>
              </>
            )}
            {isLocalScope && (
              <>
                <button className={`control-button ${sortBy === 'alpha' ? 'active' : ''}`} onClick={() => setSortBy('alpha')}>Alphabetical</button>
                <button className={`control-button ${sortBy === 'size' ? 'active' : ''}`} onClick={() => setSortBy('size')}>By Size</button>
                <button className={`control-button ${sortBy === 'partyLean' ? 'active' : ''}`} onClick={() => setSortBy('partyLean')}>Party Lean</button>
              </>
            )}
          </div>
        </div>

        {scope === 'state' && (
          <div className="controls-section">
            <label className="control-label">Filter</label>
            <div className="button-group">
              <button className={`control-button ${filterBy === 'all' ? 'active' : ''}`} onClick={() => setFilterBy('all')}>All</button>
              <button className={`control-button ${filterBy === 'R' ? 'active' : ''}`} onClick={() => setFilterBy('R')}>R-Majority</button>
              <button className={`control-button ${filterBy === 'D' ? 'active' : ''}`} onClick={() => setFilterBy('D')}>D-Majority</button>
              <button className={`control-button ${filterBy === 'mixed' ? 'active' : ''}`} onClick={() => setFilterBy('mixed')}>Mixed</button>
              <button className={`control-button ${filterBy === 'unified' ? 'active' : ''}`} onClick={() => setFilterBy('unified')}>Unified</button>
            </div>
          </div>
        )}

        <div className="search-section">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder={
              scope === 'state' ? 'Search districts, legislators, or cities...' :
              scope === 'county' ? 'Search counties or supervisors...' :
              scope === 'city' ? 'Search cities, mayors, or council members...' :
              'Search all officials, jurisdictions...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Result count */}
      {(filterBy !== 'all' || searchQuery) && (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem 0.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--newsprint)', fontWeight: 500 }}>
            {showState && `${filteredDistricts.length} district${filteredDistricts.length !== 1 ? 's' : ''}`}
            {showState && (showCounty || showCity) && ' • '}
            {showCounty && `${filteredCounties.length} count${filteredCounties.length !== 1 ? 'ies' : 'y'}`}
            {showCounty && showCity && ' • '}
            {showCity && `${filteredCities.length} cit${filteredCities.length !== 1 ? 'ies' : 'y'}`}
          </p>
        </div>
      )}

      {/* State Legislature Cards */}
      {showState && (
        <>
          {scope === 'all' && <div className="section-header"><h2>State Legislature</h2><span className="section-count">{filteredDistricts.length} districts</span></div>}
          <div className="districts-grid">
            {filteredDistricts.map((district, index) => {
              const isRMajority = district.partyComposition.R > district.partyComposition.D;
              const isDMajority = district.partyComposition.D > district.partyComposition.R;
              const isMixed = district.partyComposition.R > 0 && district.partyComposition.D > 0;

              return (
                <div
                  key={`state-${district.id}`}
                  className={`district-card ${isRMajority ? 'r-majority' : isDMajority ? 'd-majority' : ''}`}
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
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

                  <div className="party-breakdown">
                    <div className="breakdown-bar">
                      <div className="breakdown-segment breakdown-r" style={{ width: `${(district.partyComposition.R / 3) * 100}%`, backgroundColor: PARTY_COLORS.R }}></div>
                      <div className="breakdown-segment breakdown-d" style={{ width: `${(district.partyComposition.D / 3) * 100}%`, backgroundColor: PARTY_COLORS.D }}></div>
                    </div>
                    <div className="breakdown-labels">
                      <span className="breakdown-count" style={{ color: PARTY_COLORS.R }}>{district.partyComposition.R}R</span>
                      <span className="breakdown-divider">—</span>
                      <span className="breakdown-count" style={{ color: PARTY_COLORS.D }}>{district.partyComposition.D}D</span>
                      {isMixed && <span className="mixed-badge">Mixed</span>}
                    </div>
                  </div>

                  <div className="legislators-list">
                    <div className="legislator-row legislator-senator">
                      <div className="legislator-info">
                        <div className="legislator-name">{district.senator.name}</div>
                        <div className="legislator-role">Senator</div>
                      </div>
                      <div className="party-badge" style={{ backgroundColor: PARTY_COLORS[district.senator.party] }}>{district.senator.party}</div>
                    </div>
                    {district.representatives.map((rep, idx) => (
                      <div key={idx} className="legislator-row legislator-representative">
                        <div className="legislator-info">
                          <div className="legislator-name">{rep.name}</div>
                          <div className="legislator-role">Representative</div>
                        </div>
                        <div className="party-badge" style={{ backgroundColor: PARTY_COLORS[rep.party] }}>{rep.party}</div>
                      </div>
                    ))}
                  </div>

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
        </>
      )}

      {/* County Government Cards */}
      {showCounty && (
        <>
          {scope === 'all' && <div className="section-header"><h2>County Government</h2><span className="section-count">{filteredCounties.length} counties</span></div>}
          <div className="districts-grid">
            {filteredCounties.map((county, index) => {
              const total = county.supervisors.length;
              const { R, D, NP } = county.partyComposition;
              return (
                <div
                  key={`county-${county.id}`}
                  className="district-card county-card"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <div className="district-header">
                    <div className="jurisdiction-icon county-icon">
                      <span className="number-label">County</span>
                      <span className="number-value-small">{total}</span>
                    </div>
                    <div className="district-info">
                      <h3 className="district-name">{county.name}</h3>
                      <p className="district-cities">Board of Supervisors</p>
                    </div>
                  </div>

                  <div className="party-breakdown">
                    <div className="breakdown-bar">
                      {R > 0 && <div className="breakdown-segment" style={{ width: `${(R / total) * 100}%`, backgroundColor: PARTY_COLORS.R }}></div>}
                      {D > 0 && <div className="breakdown-segment" style={{ width: `${(D / total) * 100}%`, backgroundColor: PARTY_COLORS.D }}></div>}
                      {NP > 0 && <div className="breakdown-segment" style={{ width: `${(NP / total) * 100}%`, backgroundColor: NP_COLOR }}></div>}
                    </div>
                    <div className="breakdown-labels">
                      {R > 0 && <span className="breakdown-count" style={{ color: PARTY_COLORS.R }}>{R}R</span>}
                      {R > 0 && (D > 0 || NP > 0) && <span className="breakdown-divider">—</span>}
                      {D > 0 && <span className="breakdown-count" style={{ color: PARTY_COLORS.D }}>{D}D</span>}
                      {D > 0 && NP > 0 && <span className="breakdown-divider">—</span>}
                      {NP > 0 && <span className="breakdown-count" style={{ color: NP_COLOR }}>{NP}NP</span>}
                    </div>
                  </div>

                  <div className="legislators-list">
                    {county.supervisors.map((sup, idx) => {
                      const party = getParty(sup);
                      return (
                        <div key={idx} className="legislator-row">
                          <div className="legislator-info">
                            <div className="legislator-name">{sup.name}</div>
                            <div className="legislator-role">
                              {sup.title || 'Supervisor'}{sup.district != null ? ` • District ${sup.district}` : ''}
                            </div>
                          </div>
                          <div className="party-badge" style={{ backgroundColor: party ? PARTY_COLORS[party] : NP_COLOR }}>
                            {party || 'NP'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <a href={`/az_leg/local/county/${county.id}`} className="district-link county-link">
                    <span>View County Details</span>
                    <svg className="link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"></path>
                    </svg>
                  </a>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* City Government Cards */}
      {showCity && (
        <>
          {scope === 'all' && <div className="section-header"><h2>City Government</h2><span className="section-count">{filteredCities.length} cities</span></div>}
          <div className="districts-grid">
            {filteredCities.map((city, index) => {
              const total = city.members.length + (city.mayor ? 1 : 0);
              const { R, D, NP } = city.partyComposition;
              return (
                <div
                  key={`city-${city.id}`}
                  className="district-card city-card"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <div className="district-header">
                    <div className="jurisdiction-icon city-icon">
                      <span className="number-label">City</span>
                      <span className="number-value-small">{total}</span>
                    </div>
                    <div className="district-info">
                      <h3 className="district-name">{city.name}</h3>
                      <p className="district-cities">{city.governingBody}</p>
                    </div>
                  </div>

                  <div className="party-breakdown">
                    <div className="breakdown-bar">
                      {R > 0 && <div className="breakdown-segment" style={{ width: `${(R / total) * 100}%`, backgroundColor: PARTY_COLORS.R }}></div>}
                      {D > 0 && <div className="breakdown-segment" style={{ width: `${(D / total) * 100}%`, backgroundColor: PARTY_COLORS.D }}></div>}
                      {NP > 0 && <div className="breakdown-segment" style={{ width: `${(NP / total) * 100}%`, backgroundColor: NP_COLOR }}></div>}
                    </div>
                    <div className="breakdown-labels">
                      {R > 0 && <span className="breakdown-count" style={{ color: PARTY_COLORS.R }}>{R}R</span>}
                      {R > 0 && (D > 0 || NP > 0) && <span className="breakdown-divider">—</span>}
                      {D > 0 && <span className="breakdown-count" style={{ color: PARTY_COLORS.D }}>{D}D</span>}
                      {D > 0 && NP > 0 && <span className="breakdown-divider">—</span>}
                      {NP > 0 && <span className="breakdown-count" style={{ color: NP_COLOR }}>{NP}NP</span>}
                    </div>
                  </div>

                  <div className="legislators-list">
                    {city.mayor && (
                      <div className="legislator-row legislator-mayor">
                        <div className="legislator-info">
                          <div className="legislator-name">{city.mayor.name}</div>
                          <div className="legislator-role">Mayor</div>
                        </div>
                        <div className="party-badge" style={{ backgroundColor: getParty(city.mayor) ? PARTY_COLORS[getParty(city.mayor)!] : NP_COLOR }}>
                          {getParty(city.mayor) || 'NP'}
                        </div>
                      </div>
                    )}
                    {city.members.map((member, idx) => {
                      const party = getParty(member);
                      return (
                        <div key={idx} className="legislator-row">
                          <div className="legislator-info">
                            <div className="legislator-name">{member.name}</div>
                            <div className="legislator-role">
                              {member.title || 'Council Member'}
                              {member.district != null ? ` • District ${member.district}` : ''}
                              {member.ward != null ? ` • Ward ${member.ward}` : ''}
                            </div>
                          </div>
                          <div className="party-badge" style={{ backgroundColor: party ? PARTY_COLORS[party] : NP_COLOR }}>
                            {party || 'NP'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <a href={`/az_leg/local/city/${city.id}`} className="district-link city-link">
                    <span>View City Details</span>
                    <svg className="link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"></path>
                    </svg>
                  </a>
                </div>
              );
            })}
          </div>
        </>
      )}

      {((showState && filteredDistricts.length === 0) &&
        (!showCounty || filteredCounties.length === 0) &&
        (!showCity || filteredCities.length === 0)) && (
        <div className="no-results">
          <p>No results found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
