// csvProcessor.js - Advanced CSV processing and data analysis utilities

// const fs = require('fs');
// const csv = require('csv-parser');
import fs from 'fs';
import csv from 'csv-parser';

class DisasterDataProcessor {
  constructor() {
    this.data = [];
    this.indexedByType = {};
    this.indexedByLocation = {};
    this.indexedByYear = {};
    this.loaded = false;
  }

  // Load and index CSV data for fast lookups
  async loadData(filePath) {
    return new Promise((resolve, reject) => {
      const data = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          const record = this.normalizeRecord(row);
          data.push(record);
          
          // Build indexes for fast searching
          this.indexRecord(record);
        })
        .on('end', () => {
          this.data = data;
          this.loaded = true;
          console.log(`✓ Loaded ${data.length} disaster records`);
          console.log(`✓ Indexed ${Object.keys(this.indexedByType).length} disaster types`);
          console.log(`✓ Indexed ${Object.keys(this.indexedByLocation).length} locations`);
          resolve(data);
        })
        .on('error', (error) => {
          console.error('CSV loading error:', error);
          reject(error);
        });
    });
  }

  // Normalize and clean CSV record
  normalizeRecord(row) {
    return {
      id: row['DisNo.'] || null,
      classification: row['Historic Classification'] || null,
      disasterGroup: row['Disaster Group'] || null,
      disasterSubgroup: row['Disaster Subgroup'] || null,
      disasterType: this.cleanString(row['Disaster Type']),
      disasterSubtype: this.cleanString(row['Disaster Subtype']),
      eventName: row['Event Name'] || null,
      country: row['ISO'] || null,
      region: this.cleanString(row['Region']),
      subregion: this.cleanString(row['Subregion']),
      location: this.cleanString(row['Location']),
      startYear: this.parseNumber(row['Start Year']),
      startMonth: this.parseNumber(row['Start Month']),
      startDay: this.parseNumber(row['Start Day']),
      endYear: this.parseNumber(row['End Year']),
      endMonth: this.parseNumber(row['End Month']),
      endDay: this.parseNumber(row['End Day']),
      totalDeaths: this.parseNumber(row['Total Deaths']),
      injured: this.parseNumber(row['No. Injured']),
      affected: this.parseNumber(row['No. Affected']),
      homeless: this.parseNumber(row['No. Homeless']),
      totalAffected: this.parseNumber(row['Total Affected']),
      totalDamage: this.parseNumber(row["Total Damage ('000 US$)"]),
      totalDamageAdjusted: this.parseNumber(row["Total Damage, Adjusted ('000 US$)"]),
      insuredDamage: this.parseNumber(row["Insured Damage ('000 US$)"]),
      reconstructionCosts: this.parseNumber(row["Reconstruction Costs ('000 US$)"]),
      latitude: this.parseFloat(row['Latitude']),
      longitude: this.parseFloat(row['Longitude']),
      magnitude: row['Magnitude'] || null,
      magnitudeScale: row['Magnitude Scale'] || null,
      riverBasin: row['River Basin'] || null
    };
  }

  // Index a record for fast searching
  indexRecord(record) {
    // Index by disaster type
    const type = record.disasterType || 'Unknown';
    if (!this.indexedByType[type]) {
      this.indexedByType[type] = [];
    }
    this.indexedByType[type].push(record);

    // Index by location
    const location = record.location || 'Unknown';
    if (!this.indexedByLocation[location]) {
      this.indexedByLocation[location] = [];
    }
    this.indexedByLocation[location].push(record);

    // Index by year
    const year = record.startYear;
    if (year) {
      if (!this.indexedByYear[year]) {
        this.indexedByYear[year] = [];
      }
      this.indexedByYear[year].push(record);
    }
  }

  // Find disasters by type and location with fuzzy matching
  findSimilar(location, disasterType, options = {}) {
    const {
      limit = 10,
      yearRange = 50,
      includeNearby = true
    } = options;

    const currentYear = new Date().getFullYear();
    const minYear = currentYear - yearRange;

    let results = [];

    // Priority 1: Exact location + type match
    const exactMatches = this.data.filter(d => 
      this.matchLocation(d, location) &&
      this.matchDisasterType(d.disasterType, disasterType) &&
      (d.startYear || 0) >= minYear
    );
    results.push(...exactMatches);

    // Priority 2: State/Region + type match
    if (results.length < limit) {
      const regionMatches = this.data.filter(d =>
        this.matchRegion(d, location) &&
        this.matchDisasterType(d.disasterType, disasterType) &&
        (d.startYear || 0) >= minYear &&
        !results.includes(d)
      );
      results.push(...regionMatches);
    }

    // Priority 3: Country + type match (for India)
    if (results.length < limit) {
      const countryMatches = this.data.filter(d =>
        d.country === 'IND' &&
        this.matchDisasterType(d.disasterType, disasterType) &&
        (d.startYear || 0) >= minYear &&
        !results.includes(d)
      );
      results.push(...countryMatches);
    }

    // Sort by year (most recent first) and severity
    results.sort((a, b) => {
      const yearDiff = (b.startYear || 0) - (a.startYear || 0);
      if (yearDiff !== 0) return yearDiff;
      
      const severityA = (a.totalDeaths || 0) + (a.affected || 0) / 1000;
      const severityB = (b.totalDeaths || 0) + (b.affected || 0) / 1000;
      return severityB - severityA;
    });

    return results.slice(0, limit);
  }

  // Calculate comprehensive statistics
  calculateStats(disasters) {
    if (disasters.length === 0) {
      return this.getDefaultStats();
    }

    const stats = disasters.reduce((acc, d) => {
      acc.totalDeaths += d.totalDeaths || 0;
      acc.totalInjured += d.injured || 0;
      acc.totalAffected += d.affected || 0;
      acc.totalHomeless += d.homeless || 0;
      acc.totalDamage += d.totalDamage || 0;
      
      acc.maxDeaths = Math.max(acc.maxDeaths, d.totalDeaths || 0);
      acc.maxAffected = Math.max(acc.maxAffected, d.affected || 0);
      acc.maxDamage = Math.max(acc.maxDamage, d.totalDamage || 0);
      
      if (d.totalDeaths > 0) acc.fatalIncidents++;
      if (d.totalDamage > 0) acc.economicIncidents++;
      
      return acc;
    }, {
      totalDeaths: 0,
      totalInjured: 0,
      totalAffected: 0,
      totalHomeless: 0,
      totalDamage: 0,
      maxDeaths: 0,
      maxAffected: 0,
      maxDamage: 0,
      fatalIncidents: 0,
      economicIncidents: 0
    });

    const count = disasters.length;
    
    return {
      totalIncidents: count,
      avgDeaths: Math.round(stats.totalDeaths / count),
      avgInjured: Math.round(stats.totalInjured / count),
      avgAffected: Math.round(stats.totalAffected / count),
      avgHomeless: Math.round(stats.totalHomeless / count),
      avgDamage: Math.round(stats.totalDamage / count),
      maxDeaths: stats.maxDeaths,
      maxAffected: stats.maxAffected,
      maxDamage: stats.maxDamage,
      fatalityRate: ((stats.fatalIncidents / count) * 100).toFixed(1),
      economicImpactRate: ((stats.economicIncidents / count) * 100).toFixed(1),
      totalDeaths: stats.totalDeaths,
      totalAffected: stats.totalAffected,
      totalDamage: stats.totalDamage
    };
  }

  // Get risk assessment based on historical data
  getRiskAssessment(location, disasterType) {
    const similar = this.findSimilar(location, disasterType, { limit: 20 });
    const stats = this.calculateStats(similar);

    let riskLevel = 'Low';
    let riskScore = 0;

    // Calculate risk score
    if (stats.totalIncidents > 0) {
      riskScore += Math.min(stats.totalIncidents * 2, 30);
      riskScore += Math.min(stats.avgDeaths / 10, 25);
      riskScore += Math.min(stats.maxDeaths / 100, 25);
      riskScore += Math.min(stats.avgAffected / 10000, 20);
    }

    if (riskScore >= 70) riskLevel = 'High';
    else if (riskScore >= 40) riskLevel = 'Medium';

    return {
      riskLevel,
      riskScore: Math.round(riskScore),
      hasHistoricalData: similar.length > 0,
      recentIncidents: similar.filter(d => 
        (d.startYear || 0) >= new Date().getFullYear() - 10
      ).length,
      stats
    };
  }

  // Helper methods
  cleanString(str) {
    return str ? str.trim() : null;
  }

  parseNumber(val) {
    const num = parseInt(val);
    return isNaN(num) ? 0 : num;
  }

  parseFloat(val) {
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  }

  matchLocation(disaster, location) {
    const dLoc = (disaster.location || '').toLowerCase();
    const city = (location.city || '').toLowerCase();
    const state = (location.state || '').toLowerCase();
    const district = (location.district || '').toLowerCase();
    
    return dLoc.includes(city) || 
           dLoc.includes(state) || 
           (district && dLoc.includes(district));
  }

  matchRegion(disaster, location) {
    const dRegion = (disaster.region || '').toLowerCase();
    const dSubregion = (disaster.subregion || '').toLowerCase();
    const state = (location.state || '').toLowerCase();
    
    return dRegion.includes(state) || dSubregion.includes(state);
  }

  matchDisasterType(dType, queryType) {
    if (!dType || !queryType) return false;
    
    const type1 = dType.toLowerCase();
    const type2 = queryType.toLowerCase();
    
    // Exact match
    if (type1 === type2) return true;
    
    // Partial match
    if (type1.includes(type2) || type2.includes(type1)) return true;
    
    // Synonym matching
    const synonyms = {
      'flood': ['flooding', 'inundation', 'deluge'],
      'earthquake': ['quake', 'seismic', 'tremor'],
      'cyclone': ['hurricane', 'typhoon', 'storm'],
      'fire': ['wildfire', 'forest fire', 'blaze'],
      'drought': ['water scarcity', 'dry spell'],
      'landslide': ['mudslide', 'rockslide', 'slope failure']
    };
    
    for (const [key, values] of Object.entries(synonyms)) {
      if (type2.includes(key) || key.includes(type2)) {
        return values.some(syn => type1.includes(syn)) || type1.includes(key);
      }
    }
    
    return false;
  }

  getDefaultStats() {
    return {
      totalIncidents: 0,
      avgDeaths: 0,
      avgInjured: 0,
      avgAffected: 0,
      avgHomeless: 0,
      avgDamage: 0,
      maxDeaths: 0,
      maxAffected: 0,
      maxDamage: 0,
      fatalityRate: '0.0',
      economicImpactRate: '0.0',
      totalDeaths: 0,
      totalAffected: 0,
      totalDamage: 0
    };
  }

  // Get disaster trends over time
  getTrends(disasterType, yearRange = 20) {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - yearRange;
    
    const filtered = this.data.filter(d => 
      this.matchDisasterType(d.disasterType, disasterType) &&
      (d.startYear || 0) >= startYear
    );
    
    const yearlyStats = {};
    
    filtered.forEach(d => {
      const year = d.startYear || 'Unknown';
      if (!yearlyStats[year]) {
        yearlyStats[year] = {
          count: 0,
          deaths: 0,
          affected: 0,
          damage: 0
        };
      }
      
      yearlyStats[year].count++;
      yearlyStats[year].deaths += d.totalDeaths || 0;
      yearlyStats[year].affected += d.affected || 0;
      yearlyStats[year].damage += d.totalDamage || 0;
    });
    
    return yearlyStats;
  }

  // Export summary statistics
  getSummary() {
    return {
      totalRecords: this.data.length,
      disasterTypes: Object.keys(this.indexedByType).map(type => ({
        type,
        count: this.indexedByType[type].length
      })).sort((a, b) => b.count - a.count),
      locations: Object.keys(this.indexedByLocation).length,
      yearRange: {
        earliest: Math.min(...this.data.map(d => d.startYear || Infinity)),
        latest: Math.max(...this.data.map(d => d.startYear || 0))
      },
      countries: [...new Set(this.data.map(d => d.country).filter(Boolean))]
    };
  }
}

export default DisasterDataProcessor;