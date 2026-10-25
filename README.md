# Media gender pay gap sample

Source: the user-provided `UK Gender Pay Gap Data - 2025 to 2026.csv` (11,200 employer records). The source file is unchanged.

`media-pay-gap.csv` contains 86 employer records and seven columns. It includes every source record with at least one of these SIC 2007 codes:

- 58130: newspaper publishing
- 58142: consumer, business and professional periodical publishing
- 59111–59140: film, video and television production, post-production, distribution and projection (all source codes starting 591)
- 59200: sound recording and music publishing
- 60100, 60200: radio and television broadcasting
- 63910: news agencies

Classification reference: https://www.ons.gov.uk/methodology/classificationsandstandards/ukstandardindustrialclassificationofeconomicactivities/uksic2007

Selection uses all reported SIC codes, not just the first. It preserves source values, orders employers alphabetically, and replaces line breaks between SIC codes with semicolons. No records were selected based on the size or direction of their pay gap. EmployerId is retained for identification.

This is an activity-based sample, not a comprehensive list of UK media employers. Employers reporting only other codes (including 58190, other publishing) are excluded, even if their names suggest media activity. Employers with mixed activities may be included. Book publishing, software publishing and advertising alone do not qualify.

DiffMeanHourlyPercent and DiffMedianHourlyPercent are reported hourly pay gaps in percent. Positive values indicate lower female hourly pay relative to male hourly pay; negative values indicate the reverse. FemaleTopQuartile is the percentage of women in the highest hourly pay quartile, not the percentage of all women who are in that quartile. Employer-level gaps do not establish unequal pay for the same job. Each record is a reporting employer, not necessarily an entire corporate group.
