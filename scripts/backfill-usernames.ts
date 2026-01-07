
import { db } from "~/server/db";

async function main() {
  console.log("Starting username backfill...");

  const profiles = await db.profile.findMany({
    where: {
      username: null,
    },
  });

  console.log(`Found ${profiles.length} profiles without username.`);

  for (const profile of profiles) {
    if (!profile.full_name) {
      console.log(`Skipping profile ${profile.id} - No full name`);
      continue;
    }

    let baseUsername = profile.full_name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (baseUsername.length === 0) {
        baseUsername = "user" + Math.floor(Math.random() * 10000);
    }
    
    let username = baseUsername;
    let counter = 1;

    while (true) {
      const existing = await db.profile.findUnique({
        where: { username },
      });

      if (!existing) {
        break;
      }

      username = `${baseUsername}${counter}`;
      counter++;
    }

    await db.profile.update({
      where: { id: profile.id },
      data: { username },
    });

    console.log(`Updated profile ${profile.id} with username: ${username}`);
  }

  console.log("Backfill complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
