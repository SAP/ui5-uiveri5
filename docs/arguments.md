### Design
Command-line arguments override options from conf.js

command-line no conf -> default.conf.js profile=visual -> visual.profile.conf.js -> build-in defaults
command-line conf=conf.js -> conf.js no profile -> visual.profile.conf.js -> build-in defaults
command-line conf=conf.js -> conf.js profile=integration -> integration.profile.conf.js -> build-in defaults
