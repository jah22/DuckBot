const { SlashCommandBuilder, GuildScheduledEventManager, GuildScheduledEventPrivacyLevel, GuildScheduledEventEntityType, MessageFlags, GuildScheduledEventRecurrenceRuleFrequency } = require(`discord.js`);
const { DateTime } = require('luxon');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('Creates a scheduled event for your birthday ([NAME] [MONTH/DAY] [TIMEZONE] ex. Duck 1/14 UTC-5).')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the event')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('date')
                .setDescription('The date of the event (MM/DD)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('timezone')
                .setDescription('Your time zone (e.g., America/New_York or UTC-5)')
                .setRequired(true)),              
    async execute(interaction) {
        const name = interaction.options.getString('name');
        const dateInput = interaction.options.getString('date');
        const timezone = interaction.options.getString('timezone');

        const [month, day] = dateInput.split('/').map(Number);
        const now = DateTime.now();

        const eventDate = DateTime.fromObject({
            year: now.year,
            month: month,
            day: day,
            hour: 0, minute: 0, second: 0, millisecond: 0

        }).setZone(timezone, { keepLocalTime: true }).startOf('day');

        if (!eventDate.isValid || eventDate < now) {
            return interaction.reply('Please provide a valid future date in MM/DD format.');
        }

        // Convert to Unix timestamp
        const unixStartTimestamp = eventDate.toMillis();
        const eventDuration = 24 * 60 * 60 * 1000; //24 hours in milliseconds
        const unixEndTimestamp = unixStartTimestamp + eventDuration;

        try {
            const event = await interaction.guild.scheduledEvents.create({
                name: `${name} Day`,
                scheduledStartTime: new Date(unixStartTimestamp).toISOString(),
                scheduledEndTime: new Date(unixEndTimestamp).toISOString(),
                privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
                entityType: GuildScheduledEventEntityType.External,
                description: `Scheduled event: ${name}`,
                //recurrenceRule: GuildScheduledEventRecurrenceRuleFrequency.Yearly,
                entityMetadata: { location: 'Here' },
            });
            await interaction.reply({content: `Scheduled event "${event.name}" for ${eventDate.toLocaleString(DateTime.DATE_MED)} at midnight`, flags: MessageFlags.Ephemeral});
        } catch(error) {
            console.error(error);
            await interaction.reply('Failed to create the scheduled event.');
        }
        

    },
};