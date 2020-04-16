# vshell
A Slack chat bot for student advising at Ontario Tech University.

## Admin Portal Environment
File: `admin\.env`

Property      | Description                                                       |
--------------|-------------------------------------------------------------------|
HOST          | Host of the bot (must match the same value in the bot environment)|
DB_HOST       | Database server                                                   |
DB_NAME       | Database schema name                                              |
DB_PORT       | Database server port                                              |
DB_USER       | Database username                                                 |
DB_PW         | Database password                                                 |


## Bot Environment
File: `bot\.env`

Property            | Description                                |
--------------------| -------------------------------------------|
clientId            | Slack Bot clientId                         |
clientSecret        | Slack Bot clientSecret                     |
redirectUri         | Redirect URI for Slack bot endpoint URL    |
verificationToken   | Slack Bot verification token               |
DB_HOST             | Database server                            |
DB_PORT             | Database server port                       |
DB_NAME             | Database schema name                       |
DB_USER             | Database username                          |
DB_PW               | Database password                          |