const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // 1. Issue fields
    content = content.replace(/\bissue\.userId\b/g, 'issue.reportedBy');
    content = content.replace(/\bi\.userId\b/g, 'i.reportedBy');
    content = content.replace(/\btask\.userId\b/g, 'task.reportedBy');

    // date
    content = content.replace(/\bissue\.date\b/g, 'issue.createdAt?.toDate().toLocaleDateString()');
    content = content.replace(/\bissue\.completedDate\b/g, 'issue.completedAt?.toDate().toLocaleDateString()');
    content = content.replace(/\bissue\.reportedTime\b/g, 'issue.createdAt?.toDate().toLocaleTimeString()');
    content = content.replace(/\bi\.date\b/g, 'i.createdAt?.toDate().toLocaleDateString()');
    content = content.replace(/\bissue\.deadline\b/g, '"No deadline set"');
    content = content.replace(/\bi\.deadline\b/g, '"No deadline set"');

    // location and images
    content = content.replace(/\bissue\.images\b/g, '(issue.proofImages || [issue.imageUrl])');
    content = content.replace(/\bi\.images\b/g, '(i.proofImages || [i.imageUrl])');
    content = content.replace(/\bissue\.location\b/g, '({lat: issue.lat, lng: issue.lng})');
    content = content.replace(/\bi\.location\b/g, '({lat: i.lat, lng: i.lng})');
    content = content.replace(/\bissue\.distance\b/g, '"Unknown distance"');

    // 2. Renames
    content = content.replace(/\bassignedNGO\b/g, 'assignedNgoId');
    content = content.replace(/\bassignedVolunteer\b/g, 'assignedVolunteerId');
    content = content.replace(/\bngoContact\b/g, 'assignedNgoId');

    // 3. Statuses
    content = content.replace(/'resolved'/g, "'completed'").replace(/"resolved"/g, '"completed"');
    content = content.replace(/'in-progress'/g, "'assigned'").replace(/"in-progress"/g, '"assigned"');

    // 4. Imports fix
    content = content.replace(/import \w+ from ['"]\.\.\/imports\/WhatsApp_Image_[^'"]+['"];?/g, '');
    content = content.replace(/import \w+ from ['"]\.\.\/\.\.\/\.\.\/imports\/WhatsApp_Image_[^'"]+['"];?/g, '');
    content = content.replace(/import \w+ from ['"]\.\.\/\.\.\/imports\/WhatsApp_Image_[^'"]+['"];?/g, '');

    // Replace the src value safely where it's missing the import var
    content = content.replace(/src=\{logoImage\}/g, 'src="https://via.placeholder.com/150"');
    content = content.replace(/src=\{logo\}/g, 'src="https://via.placeholder.com/150"');

    // 5. Leaflet issues
    content = content.replace(/center=\{[^}]*\}/g, 'center={[0, 0]}');
    // tile layer url
    content = content.replace(/url="https:\/\/.*?"/g, 'url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
    }
}

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            replaceInFile(fullPath);
        }
    }
}

// Ensure the command runs from the root of the project
walkDir(path.join(process.cwd(), 'src', 'app', 'components'));
walkDir(path.join(process.cwd(), 'src', 'app', 'contexts'));
walkDir(path.join(process.cwd(), 'src', 'types'));
walkDir(path.join(process.cwd(), 'src'));
console.log('Replacements completed.');
