import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IndustryEntity } from 'src/utils/entities/industry.entity';
import { RegionEntity } from 'src/utils/entities/region.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SeederService {
    constructor(
          @InjectRepository(IndustryEntity) private industryEntity: Repository<IndustryEntity>,
          @InjectRepository(RegionEntity) private regionEntity: Repository<RegionEntity>,
      ) {}

      private readonly industries = [
        { id: 'aerospace', name: 'Aerospace', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'agriculture', name: 'Agriculture', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'automotive', name: 'Automotive', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'banking', name: 'Banking', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'biotechnology', name: 'Biotechnology', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'chemicals', name: 'Chemicals', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'construction', name: 'Construction', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'consulting', name: 'Consulting', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'consumer_goods', name: 'Consumer Goods', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'e_commerce', name: 'E-commerce', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'education', name: 'Education', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'energy', name: 'Energy', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'engineering', name: 'Engineering', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'entertainment', name: 'Entertainment', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'environmental_services', name: 'Environmental Services', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'fashion', name: 'Fashion', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'finance', name: 'Finance', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'food_and_beverage', name: 'Food & Beverage', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'gaming', name: 'Gaming', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'government', name: 'Government', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'healthcare', name: 'Healthcare', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'healthcare_services', name: 'Healthcare Services', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'hospitality', name: 'Hospitality', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'information_technology', name: 'Information Technology', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'insurance', name: 'Insurance', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'logistics', name: 'Logistics', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'manufacturing', name: 'Manufacturing', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'marketing', name: 'Marketing', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'media', name: 'Media', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'mining', name: 'Mining', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'non_profit', name: 'Non-Profit', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'personal_services', name: 'Personal Services', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'pharmaceuticals', name: 'Pharmaceuticals', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'publishing', name: 'Publishing', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'real_estate', name: 'Real Estate', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'renewable_energy', name: 'Renewable Energy', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'research_and_development', name: 'Research & Development', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'retail', name: 'Retail', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'security', name: 'Security', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'sports', name: 'Sports', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'telecommunications', name: 'Telecommunications', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'television', name: 'Television', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'textiles', name: 'Textiles', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'transportation', name: 'Transportation', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'travel', name: 'Travel', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'utilities', name: 'Utilities', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'veterinary_services', name: 'Veterinary Services', created_at: '2024-10-31 21:13:35.641013' },
        { id: 'wholesaling', name: 'Wholesaling', created_at: '2024-10-31 21:13:35.641013' },
      ];

      private readonly regions = [
        { id: "caribbean", name: "Caribbean" },
        { id: "central_america", name: "Central America" },
        { id: "central_asia", name: "Central Asia" },
        { id: "east_asia", name: "East Asia" },
        { id: "eastern_europe", name: "Eastern Europe" },
        { id: "middle_east", name: "Middle East" },
        { id: "north_africa", name: "North Africa" },
        { id: "north_america", name: "North America" },
        { id: "northern_europe", name: "Northern Europe" },
        { id: "oceania", name: "Oceania" },
        { id: "south_america", name: "South America" },
        { id: "south_asia", name: "South Asia" },
        { id: "southeast_asia", name: "Southeast Asia" },
        { id: "southern_europe", name: "Southern Europe" },
        { id: "sub_saharan_africa", name: "Sub-Saharan Africa" },
        { id: "western_europe", name: "Western Europe" },
      ];

      async seed() {
        for (const industry of this.industries) {
          const industryExists = await this.industryEntity.findOne({ where: { id: industry.id } });
          if (!industryExists) {
            await this.industryEntity.save(industry);
          }
        }

        for (const region of this.regions) {
            const entityExists = await this.regionEntity.findOne({ where: { id: region.id } });
            if (!entityExists) {
              await this.industryEntity.save(region);
            }
          }

        console.log('✅ Industry and region data seeded successfully!');
      }
}