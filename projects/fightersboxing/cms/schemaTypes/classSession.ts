import {defineField, defineType} from 'sanity'

const DAYS = [
  {title: 'Monday', value: 'mon'},
  {title: 'Tuesday', value: 'tue'},
  {title: 'Wednesday', value: 'wed'},
  {title: 'Thursday', value: 'thu'},
  {title: 'Friday', value: 'fri'},
  {title: 'Saturday', value: 'sat'},
  {title: 'Sunday', value: 'sun'},
]

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

/**
 * One class on the weekly schedule.
 *
 * Everything the website shows about class times comes from these
 * documents: the schedule page, the kids block, and each class page. Edit
 * one here and every page on the site follows.
 */
export const classSession = defineType({
  name: 'classSession',
  title: 'Class session',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Class name',
      type: 'string',
      description: 'Shown exactly as typed, for example Boxing Basics.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'day',
      title: 'Day',
      type: 'string',
      options: {list: DAYS, layout: 'dropdown'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'start',
      title: 'Start time',
      type: 'string',
      description: '24 hour clock: 07:00 is 7 AM, 17:45 is 5:45 PM.',
      placeholder: '18:00',
      validation: (Rule) =>
        Rule.required().regex(TIME, {name: '24 hour time, like 18:00'}),
    }),
    defineField({
      name: 'end',
      title: 'End time',
      type: 'string',
      description:
        'Optional. Leave it empty and the site shows the start time on its own, which is how the old site listed most classes.',
      placeholder: '19:00',
      validation: (Rule) => Rule.regex(TIME, {name: '24 hour time, like 19:00'}),
    }),
    defineField({
      name: 'audience',
      title: 'Who it is for',
      type: 'string',
      description:
        'Adults show on the main week board. Kids show in the youth block and on the youth page instead.',
      options: {
        list: [
          {title: 'Adults', value: 'adult'},
          {title: 'Kids', value: 'youth'},
        ],
        layout: 'radio',
      },
      initialValue: 'adult',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'programs',
      title: 'Which pages it appears on',
      type: 'array',
      of: [{type: 'string'}],
      description:
        'Pick one or more. This is what puts a class on its own page as well as on the schedule.',
      options: {
        list: [
          {title: 'Beginners boxing class', value: 'boxing-basics'},
          {title: 'Competition team training', value: 'competition'},
          {title: 'Youth boxing class', value: 'youth'},
          {title: 'Open gym', value: 'open-gym'},
        ],
      },
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  orderings: [
    {
      title: 'Day, then time',
      name: 'dayThenTime',
      by: [
        {field: 'day', direction: 'asc'},
        {field: 'start', direction: 'asc'},
      ],
    },
  ],
  preview: {
    select: {name: 'name', day: 'day', start: 'start', end: 'end', audience: 'audience'},
    prepare({name, day, start, end, audience}) {
      const label = DAYS.find((d) => d.value === day)?.title ?? day
      const time = end ? `${start} to ${end}` : start
      return {
        title: `${name}`,
        subtitle: `${label}, ${time}${audience === 'youth' ? ', kids' : ''}`,
      }
    },
  },
})
