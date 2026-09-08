# How to put the website on Hostinger

No code, no tokens, no scripts. You upload one zip file and unzip it.
About 10 minutes.

## First, the one thing to understand

The preview link I sent you is **not** the thing you upload. That link is a
special all-in-one page for reviewing.

The real website is a **folder of 25 separate pages**, and I have already
packed it into one zip file for you:

**`fighters-website.zip`**

That zip is the website. You just need to put it in the right place.

## The steps

**1. Save the zip**

Download `fighters-website.zip` and remember where it went. Probably your
Downloads folder. Do not unzip it on your computer. Hostinger will unzip it.

**2. Log in to Hostinger**

Go to hpanel.hostinger.com and log in.

**3. Open File Manager**

Click on your website, then find the button called **File Manager**.
(It might be under a "Files" heading.)

**4. Go into the `public_html` folder**

Double-click the folder named **public_html**.

This folder is the website. Whatever is in here is what people see when
they visit the domain.

**5. Empty it, if there is anything in it**

If there are old files in `public_html`, select them all and delete them.

> Careful: this deletes the old website. Only do this once you are sure
> you want the new one live. If you want to keep a copy of the old one
> first, use Hostinger's backup option before deleting.

**6. Upload the zip**

Click **Upload** (usually a up-arrow icon, top right), pick
`fighters-website.zip`, and wait. It is 7.7 MB, so it should take under a
minute.

**7. Unzip it**

Right-click on `fighters-website.zip` in the file list and choose
**Extract**. When it asks where to extract to, leave it as the current
folder (`public_html`) and confirm.

**8. Delete the zip**

Right-click `fighters-website.zip` and delete it. You do not need it on
the server anymore. It is just taking up space.

**9. Look at your website**

Go to your domain in a browser. It should be there.

If you see the old site, press **Ctrl+F5** to force a refresh. If it still
looks old, go back to hPanel and look for a **Clear Cache** button.

## Did it work?

You should be able to visit these and all of them should load:

- your domain (the homepage)
- yourdomain.com/schedule/
- yourdomain.com/coaches/
- yourdomain.com/boxing-blog/
- yourdomain.com/mindset-matters/

If the homepage works but the others give a "404 not found", something went
wrong in the unzip step. The most likely cause: the files landed in a
subfolder instead of directly in `public_html`. Open `public_html` and
check that you can see `index.html` sitting right there, not inside
another folder. If it is inside a folder, move everything up one level.

## When I make changes later

You tell me what to change. I send you a new zip. You repeat steps 5
through 9. That is the whole loop.

## If you would rather I do it

If you give me a Hostinger API token, I can upload it for you and you skip
all of the above. That is the only reason I asked for one. It is optional,
not required.

To get one: hPanel, then your account menu, then **API**, then **Generate
token**. Copy the code and paste it to me. It only shows once.
