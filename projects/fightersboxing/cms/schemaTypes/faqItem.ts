import {defineField, defineType} from 'sanity'

/**
 * One question on the FAQ page.
 *
 * The gym adds one of these the day a question comes up twice, in person or
 * online, and it shows up on /faqs/ the next time the page loads. `order`
 * controls where it sits within its section; leave gaps (10, 20, 30) so a
 * new question can slot in without renumbering everything after it.
 */
export const faqItem = defineType({
  name: 'faqItem',
  title: 'FAQ question',
  type: 'document',
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      description: 'Phrase it the way someone would actually type or ask it.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: 'text',
      rows: 5,
      description:
        'Plain text, no formatting needed. Leave a blank line between paragraphs if you want more than one.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'section',
      title: 'Section',
      type: 'string',
      options: {
        list: [
          {title: 'Starting from zero', value: 'starting'},
          {title: 'The classes', value: 'classes'},
          {title: 'Kids and teens', value: 'kids'},
          {title: 'Competing', value: 'competing'},
          {title: 'Visiting the gym', value: 'visiting'},
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order within its section',
      type: 'number',
      description: 'Lower numbers show first. Leave gaps, e.g. 10, 20, 30.',
      initialValue: 10,
    }),
  ],
  orderings: [
    {
      title: 'Section, then order',
      name: 'sectionThenOrder',
      by: [
        {field: 'section', direction: 'asc'},
        {field: 'order', direction: 'asc'},
      ],
    },
  ],
  preview: {
    select: {title: 'question', section: 'section'},
  },
})
