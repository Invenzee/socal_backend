import { slugify } from "../lib/slug.js";
import { Category } from "../models/category.model.js";
import { Condition } from "../models/condition.model.js";
import { Feature } from "../models/feature.model.js";
import { FuelType } from "../models/fuel-type.model.js";
import { Make } from "../models/make.model.js";
import { Transmission } from "../models/transmission.model.js";
import { TruckModel } from "../models/truck-model.model.js";

const MAKES: Record<string, string[]> = {
  Freightliner: ["Cascadia", "Coronado", "M2 106", "108SD", "114SD"],
  Peterbilt: ["579", "389", "567", "365", "520"],
  Kenworth: ["T680", "W900", "T880", "T180", "T280"],
  Volvo: ["VNL", "VNR", "VHD", "VAH"],
  Mack: ["Anthem", "Pinnacle", "Granite", "MD6"],
  International: ["LT", "RH", "HV", "MV", "HX"],
  "Western Star": ["49X", "47X", "57X"],
  Hino: ["L6", "XL8", "XL7"],
  Isuzu: ["NPR", "NQR", "FTR", "NRR"],
  Ford: ["F-150", "F-250", "F-350", "Super Duty", "Ranger", "Mustang", "Explorer", "F-650"],
  Ram: ["1500", "2500", "3500", "ProMaster"],
  Chevrolet: ["Silverado 1500", "Silverado 2500HD", "Colorado", "Camaro", "Tahoe"],
  GMC: ["Sierra 1500", "Sierra 2500HD", "Canyon", "Yukon"],
  Toyota: ["Tundra", "Tacoma", "Camry", "RAV4", "Highlander"],
  Nissan: ["Titan", "Frontier", "Altima", "Rogue"],
  BMW: ["3 Series", "5 Series", "8 Series", "X5"],
  "Mercedes-Benz": ["C-Class", "E-Class", "Sprinter", "Actros"],
  Audi: ["A4", "A6", "Q5", "Q7"],
  Honda: ["Civic", "Accord", "CR-V", "Ridgeline"],
  Jeep: ["Wrangler", "Grand Cherokee", "Gladiator"],
  Tesla: ["Model 3", "Model Y", "Cybertruck"],
  Hyundai: ["Elantra", "Santa Fe", "Tucson"],
  Kia: ["K5", "Telluride", "Sportage"],
  Volkswagen: ["Jetta", "Atlas", "Golf"],
  Dodge: ["Charger", "Challenger", "Durango"],
};

const FEATURES = [
  "4WD / AWD",
  "Backup Camera",
  "Bluetooth",
  "Leather Seats",
  "Navigation",
  "Towing Package",
  "Sleeper Cab",
  "APU",
  "Collision Mitigation",
  "Lane Keep Assist",
  "Adaptive Cruise",
  "Heated Seats",
  "Apple CarPlay",
  "Android Auto",
  "Sunroof",
  "Blind-spot warning",
  "Remote Starter",
  "Air Conditioning",
  "Power Windows",
  "Cruise Control",
  "Keyless Entry",
  "Aluminum Wheels",
  "Running Boards",
  "Fifth Wheel",
  "Wet Kit",
  "Liftgate",
  "Reefer Unit",
  "DVD Player",
  "Rear-spot warning",
];

const CONDITIONS = ["New", "Used", "Excellent", "Good", "Fair", "Poor"];

const CATEGORIES = [
  "Sleeper Cab",
  "Day Cab",
  "Dump Truck",
  "Flatbed",
  "Box Truck",
  "Refrigerated",
  "Tanker",
  "Semi Tractor",
  "Pickup",
  "Coupe",
  "Luxury Car",
  "Sedan",
  "Sports Car",
  "Wagon",
  "SUV",
  "Van",
  "Hatchback",
  "Convertible",
  "Chassis Cab",
  "Rollback",
  "Mixer",
  "Garbage Truck",
];

const FUELS = ["Diesel", "Gasoline", "Electric", "Hybrid", "CNG", "LNG", "Hydrogen", "Biodiesel"];

const TRANSMISSIONS = ["Automatic", "Manual", "Automated Manual (AMT)", "Dual Clutch", "CVT"];

async function upsertNamed(
  Model: { findOneAndUpdate: Function },
  names: string[],
) {
  for (const [index, name] of names.entries()) {
    await Model.findOneAndUpdate(
      { slug: slugify(name) },
      { name, slug: slugify(name), isActive: true, sortOrder: index },
      { upsert: true, returnDocument: "after" },
    );
  }
}

export async function seedTaxonomy() {
  await upsertNamed(Feature, FEATURES);
  await upsertNamed(Condition, CONDITIONS);
  await upsertNamed(Category, CATEGORIES);
  await upsertNamed(FuelType, FUELS);
  await upsertNamed(Transmission, TRANSMISSIONS);

  let makeOrder = 0;
  for (const [makeName, models] of Object.entries(MAKES)) {
    const make = await Make.findOneAndUpdate(
      { slug: slugify(makeName) },
      { name: makeName, slug: slugify(makeName), isActive: true, sortOrder: makeOrder },
      { upsert: true, returnDocument: "after" },
    );
    makeOrder += 1;

    for (const [index, modelName] of models.entries()) {
      await TruckModel.findOneAndUpdate(
        { make: make._id, slug: slugify(modelName) },
        {
          name: modelName,
          slug: slugify(modelName),
          make: make._id,
          isActive: true,
          sortOrder: index,
        },
        { upsert: true, returnDocument: "after" },
      );
    }
  }

  console.log("Taxonomy seeded (trucks + cars).");
}
