
# Final Project

- [Overview](#overview)
- [Frontend](#frontend)
- [Backend](#backend)
- [Timeline](#timeline)


<a name="overview"/>

## Overview

This webapp will server as a wardrobe manager app. It will work similarly to how a kitchen manager app would work -- by saving recipes (outfits) and suggesting recipes based on avaialble foods (clothes).

The user will, over time, enter information about the items in their closet and about outfits that they wear. The extent of detail will depend on the user, but they will have the option to enter a large array of data. The most important fields will be those inputs that are crucial to the app's algorithms. 

The app will then use various algorithms to suggest outfit combinations -- in a way acting as a stylist, and incorporating staple fashion advice practically such that the user doesn't have to learn it for themselves. 

Perhaps most helpful, the app can simply serve as a log of outfits. There can be a large benefit to having a list of outfits (characterized by each constituent item) and a rating system attached to those oufits -- as well as other sorting parameters like temperature, formality, and so on. 

<a name="frontend"/>

## Frontend


#### Login / Register Page

![login page](./concept/login.png)

#### Add Items Page

The required fields will be indicated somehow. 

For the item's colors field (the colors of the item the user is adding), I will try to use a library that can parse colors from a picture; but if that turns out to be unrealistic, I will just put a color selector input.


![add-item page](./concept/add-item.png)

#### Log Outfit Page

![log outfit page](./concept/log-outfit.png)


#### Generate Outfit Page

1. Start from one item or one color
2. Get recommendations based on color algorithm, defined rules, and relationships in settings

#### Browse Wardrobe Page

Browse user's items.

#### Wardrobe Analytics Page ?

If realistic to implement, some analytics based on the data the user passes. For example, where the user spends most money in terms of clothing type. 


<a name="backend"/>

## Backend


<a name="timeline"/>

## Timeline

#### Brainstorm Features
  - Similar: [Dress me app](https://www.dress-meapp.com/)
- Use [Mannequin.js](https://boytchev.github.io/mannequin.js/) to model mockups
- Color selection from picture such as feature on [coolors.co](https://coolors.co/)