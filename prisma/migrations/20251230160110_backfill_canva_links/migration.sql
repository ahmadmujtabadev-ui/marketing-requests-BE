-- Backfill Canva links from PDF
UPDATE "categories"
SET "canvaFolderUrl" = CASE "name"
  WHEN 'Discover' THEN 'https://www.canva.com/design/DAG7Vr4U-vE/f0tbQ7mUxFE8QqlvNiz6Fg/edit?utm_content=DAG7Vr4U-vE&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton'
  WHEN 'Expired Farming' THEN 'https://www.canva.com/design/DAG3S4Rfelk/X53jnx5p3poARO5kBz1wNQ/edit?utm_content=DAG3S4Rfelk&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton'
  WHEN 'Farming' THEN 'https://www.canva.com/design/DAG7EXu5870/dPn__J79wyWnOOYJaJ07ZQ/edit?utm_content=DAG7EXu5870&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton'
  WHEN 'Flyers' THEN 'https://www.canva.com/design/DAG7E16UjBU/psA5gEdoI6sg7EIj3u9p0Q/edit?utm_content=DAG7E16UjBU&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton'
  WHEN 'General' THEN 'https://www.canva.com/design/DAG7Vj-gA1Q/dzZTpJSXhbpoS_oofajrCw/edit?utm_content=DAG7Vj-gA1Q&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton'
  WHEN 'Listings' THEN 'https://www.canva.com/design/DAG7VvSLVp8/yz01ZPPHigQnY3OJDj9ksg/edit?utm_content=DAG7VvSLVp8&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton'
  WHEN 'Market Update' THEN 'https://www.canva.com/design/DAG7VlBhbXg/xE_4gE4Q2klvXSt4lBd7Zg/edit?utm_content=DAG7VlBhbXg&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton'
  WHEN 'Marketing Brochures' THEN 'https://www.canva.com/design/DAG7EqoiptI/hG-55UW_B3_BQM2rnIoFfQ/edit?utm_content=DAG7EqoiptI&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton'
  WHEN 'Onboarding' THEN 'https://www.canva.com/design/DAG3SrqQ8tI/7cePutvWirHo2KclsdXifg/edit?utm_content=DAG3SrqQ8tI&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton'
  WHEN 'Open House' THEN 'https://www.canva.com/design/DAG7VnmbCOs/851GCsBasLD_fJZPgz9XEQ/edit?utm_content=DAG7VnmbCOs&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton'
  WHEN 'Postcards (6x4)' THEN 'https://www.canva.com/design/DAG7EwzdYp8/ShRrOzk0fSfC5fti1I4DhA/edit?utm_content=DAG7EwzdYp8&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton'
  WHEN 'Postcards (7x5)' THEN 'https://www.canva.com/design/DAG7EqoiptI/hG-55UW_B3_BQM2rnIoFfQ/edit?utm_content=DAG7EqoiptI&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton'
  WHEN 'Testimonial' THEN 'https://www.canva.com/design/DAG0e7q-oyc/2RFGpY-Bjripq0WuHfnN9g/edit?utm_content=DAG0e7q-oyc&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton'
  WHEN 'Open House Flyers' THEN 'https://www.canva.com/design/DAG7E16UjBU/psA5gEdoI6sg7EIj3u9p0Q/edit?utm_content=DAG7E16UjBU&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton'
  ELSE "canvaFolderUrl"
END
WHERE "name" IN (
  'Discover',
  'Expired Farming',
  'Farming',
  'Flyers',
  'General',
  'Listings',
  'Market Update',
  'Marketing Brochures',
  'Onboarding',
  'Open House',
  'Postcards (6x4)',
  'Postcards (7x5)',
  'Testimonial',
  'Open House Flyers'
);

-- Backfill Template.categoryId using Category.name <-> Template.category (500+ templates)
UPDATE "templates" t
SET "categoryId" = c."id"
FROM "categories" c
WHERE t."category" IS NOT NULL
  AND t."categoryId" IS NULL
  AND TRIM(t."category") = c."name";
